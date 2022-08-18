const EventHeap = require('../common/eventheap');
const Paladin = require('../common/paladin');
const DATA = require('../common/gamevalues');
const Utility = require('../common/utilities');

class Logger {
    // output can be one of the following
    // 0 - console,
    // 1 - array object
    constructor(logLevel, outputLocation=0) {
        this._logLevel = logLevel;
        this._outputLocation = outputLocation;
        this._resultArr = [];
    }

    saveToArray(message) {
        this._resultArr.push(message);
    }

    // logs message if logger's level exceeds minLogLevel
    log(message, minLogLevel) {
        if (this._logLevel >= minLogLevel) {
            if (this._outputLocation === 0) {
                console.log(message);
            } else if (this._outputLocation === 1) {
                this.saveToArray(message);
            }
        }
    }
}

class Experiment {
    // loggerOutputLocation of 0 means print to console
    constructor(playerOptions, loggerOutputLocation=0) {
        if (playerOptions['trinkets'].length > 2) {
            throw new Error('Please select no more than two trinkets');
        }
        this._playerOptions = playerOptions;
        this._loggerOutputLocation = loggerOutputLocation;
    }

    // we split out the various handler event functions to make it easier to do unit testing
    handleOffGcdManaCooldown(nextEvent, eventHeap) {
        let currentTime = nextEvent._timestamp,
            manaSource = nextEvent._subEvent,
            cooldownInfo = DATA['manaCooldowns'][manaSource];

        if (cooldownInfo['category'] === 'interval') {
            // nextEvent._subEvent refers to MANA_TIDE_TOTEM, etc
            eventHeap.addIntervalEvents(currentTime, 'MANA_TICK', manaSource, cooldownInfo['numIntervals'], cooldownInfo['secsBetweenInterval'], cooldownInfo['startAtTimestamp']);
        }
        if (this.logger) this.logger.log(`${currentTime}s: Used ${manaSource}`, 2);
    }

    handleManaTick(nextEvent, player, eventHeap) {
        let currentTime = nextEvent._timestamp,
            manaSource = nextEvent._subEvent;
        if (manaSource === 'replenishment') {
            player.addManaRegenFromReplenishmentAndOtherMP5(this.logger, currentTime);
            // assume replenishment ticks every 2s
            eventHeap.addEvent(currentTime + 2, 'MANA_TICK', 'replenishment');
        } 
        // divine plea/mana_tide or innervate
        else {
            // nextEvent._subEvent is INNERVATE, DIVINE_PLEA, etc
            let cooldownInfo = DATA['manaCooldowns'][nextEvent._subEvent];
            if (cooldownInfo['subCategory'] === 'percentageManaPool') {
                player.addManaRegenPercentageOfManaPool(currentTime, DATA['manaCooldowns'][manaSource]['percentageManaPool'], manaSource, this.logger);
            } if (cooldownInfo['subCategory'] === 'fixed') {
                player.addManaHelper(DATA['manaCooldowns'][manaSource]['tickAmount'], manaSource, this.logger, currentTime);
            }
        }
    }

    // seed === 0 means we don't use a seed
    runSingleLoop(logsLevel=0, seed=0, maxMinsToOOM=10) {
        let rng = Utility.setSeed(seed);
        // console.log('using seed: ' + seed);
        this.logger = new Logger(logsLevel, this._loggerOutputLocation);

        // rather than saving player/eventHeap to experiement, we recreate it each time we run a loop
        // this ensures that we are always starting anew when we run a loop
        // makes a copy of playerOptions to avoid bugs where we override the original options
        let copiedOptions = JSON.parse(JSON.stringify(this._playerOptions));
        // KIV -> think about if this is extendable for other classes. sow (seal of wisdom is a pally only thing for instance)
        let player = new Paladin(copiedOptions, rng, ['crit', 'soup', 'eog', 'sow', 'dmcg'], maxMinsToOOM);
        let eventHeap = new EventHeap();
        let currentTime = 0,
            lastCastTimestamp = 0,
            spellIndex = 0,
            spellSelected = null,
            nextEvent = null,
            eventsToCreate = [],
            cooldownUsed = null,
            status, errorMessage, offset;

        // assume first cast is always holy light
        // spellSelected = this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, 0, this._playerOptions['firstSpell']);
        spellSelected = this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, 0);
        // assume first mana tick in 2s
        eventHeap.addEvent(2, 'MANA_TICK', 'replenishment');

        while (eventHeap.hasElements() && currentTime <= maxMinsToOOM * 60) {
            nextEvent = eventHeap.pop();
            currentTime = nextEvent._timestamp;

            // handles stuff like divine plea, LoH that consume gcd
            if (nextEvent._eventType === 'MANA_COOLDOWN_SPELL_CAST') {
                let cooldownInfo = DATA['manaCooldowns'][nextEvent._subEvent];

                if (cooldownInfo['category'] === 'interval') {
                    eventHeap.addIntervalEvents(currentTime, 'MANA_TICK', nextEvent._subEvent, cooldownInfo['numIntervals'], cooldownInfo['secsBetweenInterval'], cooldownInfo['startAtTimestamp']);
                }
                player.addNonHealingSpellsWithGcdToStatistics()
                this.logger.log(`${currentTime}s: Used ${nextEvent._subEvent}`, 2);
                // continues with next spell in simulation
                // NOTE: we use player._gcd as this is reduced by hastefactor
                this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime + player._gcd, spellIndex, 0);
                spellIndex += 1
            }
            // for mana cooldowns that don't use gcd (e.g. if u are pally, and benefit from mana tide)
            else if (nextEvent._eventType === 'MANA_COOLDOWN_OFF_GCD') {
                this.handleOffGcdManaCooldown(nextEvent, eventHeap);
            }
            else if (nextEvent._eventType === 'SPELL_CAST') {
                // offset is when we cast an instant spell like holyshock, should put the next spell on gcd
                [status, errorMessage, offset, eventsToCreate] = player.castSpell(nextEvent._subEvent, currentTime, spellIndex, this.logger);
                // ends simulation if player is oom
                if (status == 0) {
                    this.logger.log(errorMessage, 2);
                    break;
                }

                lastCastTimestamp = currentTime;
                // e.g. set a BUFF_EXPIRE event
                for (let evt of eventsToCreate) {
                    eventHeap.addEvent(evt['timestamp'], evt['eventType'], evt['subEvent']);
                }
                eventsToCreate = [];

                // not oom, so continue the simulation
                // before casting, check if we can use a mana cooldown
                // if useManaCooldownStatus is 0, implies no cooldown used
                // 1 implies manacooldown used but not on gcd (so don't worry)
                // 2 implies it slows down gcd
                let useManaCooldownStatus, useManaCooldownEvents;
                [useManaCooldownStatus, useManaCooldownEvents] = player.useManaCooldown(currentTime + offset, this.logger);

                // useManaCooldownEvents include casting mana cooldowns that use gcd (divine plea), or setting up expire buff events (divine illumination)
                for (let useManaCooldownEvent of useManaCooldownEvents) {
                    eventHeap.addEvent(useManaCooldownEvent['timestamp'], useManaCooldownEvent['eventType'], useManaCooldownEvent['subEvent']);
                }

                // if we don't use up the gcd, then we just let player object handle the spell/cooldown, and continue casting
                // KIV -> what if cross class mana cooldown like innervate/mana tide?
                if (useManaCooldownStatus === 0 || useManaCooldownStatus === 1) {
                    this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, offset);
                } 

                // this.logger.log(`${player._statistics['overall']['spellsCasted'] / currentTime * 60}`, 3)
                // this.logger.log(`${player._statistics['overall']['spellsCasted']}`, 3)

                spellIndex += 1
            } else if (nextEvent._eventType === 'BUFF_EXPIRE') {
                // code here sets availableForUse to false; this is fine, as we have other code that checks for availability on next spellcast
                player.setBuffActive(nextEvent._subEvent, false, currentTime, false, this.logger);
            } else if (nextEvent._eventType === 'MANA_TICK') {
                this.handleManaTick(nextEvent, player, eventHeap);
            }

            player.checkOverflowMana();
            this.logger.log(`${player}\n----------`, 2);
        } //end while loop


        let statistics = player.calculate_statistics_after_sim_ends(lastCastTimestamp);
        return {ttoom: lastCastTimestamp, statistics: statistics, logs: this.logger._resultArr};
    }

    runBatch(batchSize=10, seed=0, logsLevel=0, numBins=30) {
        let timings = [], manaGeneratedStatistics = [], spellsCastedStatistics = [], medianEntry, resultSingleLoop, binResults;
        // if seed is 0, we get a random number from 1 to 9999 and used it to seed
        if (seed === 0) {
            seed = Math.floor(Math.random() * 10000 + 1)
        }
        // this is because we want a seed value that can be used to generate the exact log later
        for (let i = 0; i < batchSize; i++) {
            // passing seed == 0 into runSingleLoop will mean it's random
            // thus, we multiply seed by i + 1 instead
            resultSingleLoop = this.runSingleLoop(logsLevel, seed * (i + 1));
            manaGeneratedStatistics.push(resultSingleLoop['statistics']['manaGenerated']);
            spellsCastedStatistics.push(resultSingleLoop['statistics']['spellsCasted']);
            timings.push({ttoom: resultSingleLoop['ttoom'], seed: seed * (i + 1)});
        }

        medianEntry = Utility.medianArrDict(timings, 'ttoom');
        // should probably be split out in future
        binResults = Utility.createBins(timings, numBins, 'ttoom');
        let labels = binResults.map(bin => (bin.minNum + bin.maxNum) / 2);
        let values = binResults.map(bin => bin.count);
        // for each bin, we provide one example seed that user can click on
        let exampleEntries = binResults.map(bin => bin.entries.length > 0 ? bin.entries[0] : null);
        // we return median index as well, so frontend can color chart separately
        let medianIndex = 0;
        for (let i = 0; i < binResults.length; i++) {
            if (binResults[i].maxNum >= medianEntry['ttoom']) break;
            medianIndex++;
        }
        let minXAxis = binResults[0].minNum, maxXAxis = binResults[binResults.length - 1].maxNum;

        // we run a single iteration of the median seed to get log info
        // first argument is logLevel - 2 shows most details but ommits crti details
        resultSingleLoop = this.runSingleLoop(3, medianEntry['seed']);
        // console.log(resultSingleLoop['logs'])
        return {
            ttoom: medianEntry['ttoom'],
            logs: resultSingleLoop['logs'],
            manaStatistics: Utility.medianStatistics(manaGeneratedStatistics, 'source', 'MP5', 'floor'),
            spellsCastedStatistics: Utility.medianStatistics(spellsCastedStatistics, 'spell', 'cpm', '1dp'),
            // statistics: resultSingleLoop['statistics'][0],
            chartDetails: {
                labels: labels,
                values: values,
                medianIndex: medianIndex,
                exampleEntries: exampleEntries,
                minXAxis: minXAxis,
                maxXAxis: maxXAxis,
            }
        };
    }

    selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, offset) {
        let spellSelected = player.selectSpell(currentTime, spellIndex);
        let spellFinishCastingTimestamp = currentTime + spellSelected['castTime'] + offset;

        // self.add_spell_cast_helper(event_heap, selected_spell['name'], is_crit, is_soup_proc, is_sow_proc, is_eog_proc, current_time, cast_time + offset)
        eventHeap.addEvent(spellFinishCastingTimestamp, 'SPELL_CAST', spellSelected['key']);
        return spellSelected;
    }
}

module.exports = Experiment;