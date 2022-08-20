const EventHeap = require('../ttoom/eventheap');
const Paladin = require('../ttoom/paladin');
const DATA = require('../ttoom/gamevalues');
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

    handleManaTick(nextEvent, player, eventHeap, spellIndex=-1) {
        let currentTime = nextEvent._timestamp,
            manaSource = nextEvent._subEvent;
        if (manaSource === 'replenishment') {
            player.addManaRegenFromReplenishmentAndOtherMP5(this.logger, currentTime);
            // assume replenishment ticks every 2s
            eventHeap.addEvent(currentTime + 2, 'MANA_TICK', 'replenishment');
        } 
        // code here is for the standalone events for sacred shield and judgement that we created
        // because we haven't introduced it in system yet
        // makeshift code that willl replaced eventually
        // chanceForSealOfWisdomProc_normal or chanceForSealOfWisdomProc_judgment
        else if (manaSource.startsWith('chanceForSealOfWisdomProc')) {
            let procKind = nextEvent._subEvent.split('_')[1];
            this.logger.log(`${currentTime}s: Chance for SoW from misc instant spell`, 2);

            player.checkForAndHandleSoWProc(currentTime, spellIndex, this.logger);
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

        // temporary measure -  we set up SoW chances
        // 1 Sacred Shield, 2 from judgement (Beacon doesnt proc SoW since it resets, and divine plea/HS SoW is calculated separately)
        // assumption: first judgement doesnt restore mana since it's our first cast as we are running in
        // and thus even if sow hits, mana pool is still full
        // meanwhile sacred shield is already precasted and refreshed 60s later
        // thus, we begin our SoW checks only 60s into the fight
        // technically, judgement and the melee have different hit chance and judgement can't be blocked
        // for now, disregard
        // NEED TO ADDINTERVAL - > should tick for until forver
        if (player._playerClass === 'paladin') {
            let t = 0;
            while (t <= maxMinsToOOM * 60) {
                // sacred shield
                eventHeap.addEvent(t + 59.5, 'MANA_TICK', 'chanceForSealOfWisdomProc_normal');
                // judgement
                eventHeap.addEvent(t + 61, 'MANA_TICK', 'chanceForSealOfWisdomProc_normal');
                eventHeap.addEvent(t + 61, 'MANA_TICK', 'chanceForSealOfWisdomProc_judgment');

                t += 60;
            }
        }

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

                // should refactor in future
                // for paladins, assume that their mana cooldowns like divine plea and loh can proc sow
                if (player._playerClass === 'paladin') {
                    player.checkForAndHandleSoWProc(currentTime, spellIndex, this.logger, 'normal');
                    if (nextEvent._subEvent === 'DIVINE_PLEA') {
                        player.setBuffActive('divinePlea', true, currentTime);
                        eventHeap.addEvent(currentTime + DATA['manaCooldowns']['DIVINE_PLEA']['totalDuration'], 'BUFF_EXPIRE', 'divinePlea');
                    }
                }

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
                this.handleManaTick(nextEvent, player, eventHeap, spellIndex);
            }

            player.checkOverflowMana();
            this.logger.log(`${player}\n----------`, 2);
        } //end while loop


        let statistics = player.calculate_statistics_after_sim_ends(lastCastTimestamp),
            hps = Math.floor(player._statistics['overall']['healing'] / lastCastTimestamp);
        // console.log(statistics);
        return {ttoom: lastCastTimestamp, statistics: statistics, logs: this.logger._resultArr, hps: hps};
    }

    runBatch(batchSize=10, seed=0, logsLevel=0, numBins=30) {
        let timings = [], listOfHPS = [], manaGeneratedStatistics = [], spellsCastedStatistics = [], medianEntry, resultSingleLoop, binResults;
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
            listOfHPS.push(resultSingleLoop['hps']);
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

        // gets the hps, mana cost and cpm of spells casted, and combines it into a single list
        let cpmSummary = Utility.medianStatistics(spellsCastedStatistics, 'spell', 'cpm', '1dp'),
            manaCostSummary = Utility.medianStatistics(spellsCastedStatistics, 'spell', 'avgManaCost', 'floor'),
            hpetSummary = Utility.medianStatistics(spellsCastedStatistics, 'spell', 'hpet', 'floor');

        let castProfileSummary = [];
        for (let cpmEntry of cpmSummary) {
            let _spell = cpmEntry['spell'],
                manaEntry = manaCostSummary.find((_m) => _m['spell'] === _spell),
                hpetEntry = hpetSummary.find((_m) => _m['spell'] === _spell);

            castProfileSummary.push({
                spell: cpmEntry['spell'],
                'CPM': cpmEntry['cpm'],
                'Cost': manaEntry['avgManaCost'],
                'HPET': hpetEntry['hpet'],
            });

        };

        // we run a single iteration of the median seed to get log info
        // first argument is logLevel - 2 shows most details but ommits crti details
        resultSingleLoop = this.runSingleLoop(3, medianEntry['seed']);
        // console.log(resultSingleLoop['logs'])
        return {
            ttoom: medianEntry['ttoom'],
            hps: Utility.median(listOfHPS),
            logs: resultSingleLoop['logs'],
            manaStatistics: Utility.medianStatistics(manaGeneratedStatistics, 'source', 'MP5', 'floor'),
            spellsCastedStatistics: castProfileSummary,
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