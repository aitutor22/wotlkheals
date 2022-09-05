// NEED TO FIX DMCG -> buff expire is nto being called

const EventHeap = require('../ttoom/eventheap');
const Paladin = require('../ttoom/paladin');
const Shaman = require('../ttoom/shaman');
const DATA = require('../ttoom/gamevalues');
const Utility = require('../common/utilities');
const Logger = require('../common/logger');


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

    // creates healing over time events
    initializeHotEvents(nextEvent, player, eventHeap) {
        let currentTime = nextEvent._timestamp,
            hotSpellKey = nextEvent._subEvent,
            spellIndex = -1;

        // looking for riptide|1, where 1 is spellIndex
        if (hotSpellKey.indexOf('|') > -1) {
            let entries = hotSpellKey.split('|');
            hotSpellKey = entries[0];
            spellIndex = entries[1];
        }
        let hotSpellData = player.classInfo['spells'].find((_spell) => _spell['key'] === hotSpellKey)

        eventHeap.addIntervalEvents(currentTime, 'HOT_TICK', hotSpellKey, hotSpellData['numIntervals'], hotSpellData['secsBetweenInterval'], hotSpellData['startAtTimestamp'], spellIndex);
        this.logger.log(`Initialising ${hotSpellKey} HoTs`, 2);
    }

    // handle hots like sacred shield
    handleHotTick(nextEvent, player, eventHeap, spellIndex=-1) {
        let currentTime = nextEvent._timestamp,
            hotSource = nextEvent._subEvent;

        player.calculateHoT(hotSource, currentTime, this.logger);
    }

    createPlayer(playerClass, playerOptions, rng, maxMinsToOOM) {
        let mapPlayerClass = {
            'paladin': Paladin,
            'shaman': Shaman,
        }
        // makes a copy of playerOptions to avoid bugs where we override the original options
        let copiedOptions = JSON.parse(JSON.stringify(playerOptions));
        let thresholds = ['crit', 'ied'];

        // class specific rng like seal of wisdom
        if (playerClass === 'paladin') {
            thresholds.push('sow');
        } else if (playerClass === 'shaman') {
            thresholds.push(...['waterShield', 'earthliving', 'earthShieldCrit']);
        }

        // these trinkets have rng effects - if player has selected them, then add
        for (let key of ['soup', 'eog', 'dmcg', 'soulDead']) {
            if (playerOptions.trinkets.indexOf(key) > -1) {
                thresholds.push(key);
            }
        }
        return new mapPlayerClass[playerClass](copiedOptions, rng, thresholds, maxMinsToOOM);
    }

    addEventsToEventHeap(eventHeap, eventsToCreate) {
        for (let evt of eventsToCreate) {
            eventHeap.addEvent(evt['timestamp'], evt['eventType'], evt['subEvent']);
        }
    }

    // seed === 0 means we don't use a seed
    runSingleLoop(logsLevel=0, seed=0, playerClass='paladin', maxMinsToOOM=10) {
        let rng = Utility.setSeed(seed);
        this.logger = new Logger(logsLevel, this._loggerOutputLocation);

        // rather than saving player/eventHeap to experiement, we recreate it each time we run a loop
        // this ensures that we are always starting anew when we run a loop
        let player = this.createPlayer(playerClass, this._playerOptions, rng, maxMinsToOOM);

        let eventHeap = new EventHeap();
        let currentTime = 0,
            lastCastTimestamp = 0,
            spellIndex = 0,
            spellSelected = null,
            nextEvent = null,
            eventsToCreate = [],
            cooldownUsed = null,
            status, errorMessage, offset;

        // for shaman, we need to pass in event heap to allow it to track riptide
        if (playerClass === 'shaman') {
            player.createRiptideTracker(eventHeap);
        }

        // assume first cast is always holy light
        // spellSelected = this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, 0, this._playerOptions['firstSpell']);
        spellSelected = this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, 0);
        // assume first mana tick in 2s
        eventHeap.addEvent(2, 'MANA_TICK', 'replenishment');


        // check that ss can proc sow

        // temporary measure -  we set up SoW chances
        // 2 from judgement (Beacon doesnt proc SoW since it resets, and divine plea/HS SoW is calculated separately)
        // assumption: first judgement doesnt restore mana since it's our first cast as we are running in
        // and thus even if sow hits, mana pool is still full
        // thus, we begin our SoW checks only 60s into the fight
        // technically, judgement and the melee have different hit chance and judgement can't be blocked
        // for now, disregard
        // NEED TO ADDINTERVAL - > should tick for until forver
        if (player._playerClass === 'paladin') {
            let t = 0;
            while (t <= maxMinsToOOM * 60) {
                // judgement
                eventHeap.addEvent(t + 61, 'MANA_TICK', 'chanceForSealOfWisdomProc_normal');
                eventHeap.addEvent(t + 61, 'MANA_TICK', 'chanceForSealOfWisdomProc_judgment');

                t += 60;
            }
            // manually added (should improve code) sacred shield as it is precasted
            eventHeap.addEvent(0, 'INITIALIZE_HOT_EVENTS', 'SACRED_SHIELD|-1');
        } else if (player._playerClass === 'shaman') {
            // manually added
            eventHeap.addEvent(0, 'INITIALIZE_HOT_EVENTS', 'EARTH_SHIELD|-1');
        }

        while (eventHeap.hasElements() && currentTime <= maxMinsToOOM * 60) {
            nextEvent = eventHeap.pop();
            currentTime = nextEvent._timestamp;

            // handles stuff like divine plea, LoH that consume gcd
            if (nextEvent._eventType === 'MANA_COOLDOWN_SPELL_CAST') {
                let cooldownInfo = DATA['manaCooldowns'][nextEvent._subEvent];

                if (cooldownInfo['category'] === 'interval') {
                    eventHeap.addIntervalEvents(currentTime, 'MANA_TICK', nextEvent._subEvent, cooldownInfo['numIntervals'], cooldownInfo['secsBetweenInterval'], cooldownInfo['startAtTimestamp'], spellIndex);
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

                // shouldn't actually produce events here, but just in case
                eventsToCreate = player.checkHandleProcsOnCastWithICD(currentTime, spellIndex, this.logger);
                this.addEventsToEventHeap(eventHeap, eventsToCreate);

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
                // castSpell passes HoT creation events, etc
                this.addEventsToEventHeap(eventHeap, eventsToCreate);
                // for (let evt of eventsToCreate) {
                //     console.log('creating event');
                //     console.log(evt);
                //     eventHeap.addEvent(evt['timestamp'], evt['eventType'], evt['subEvent']);
                // }

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
                // note that for chain heal, this means that we assume it only has 1 chance to proc per CH cast, rather than x4 from 4 bounces
                eventsToCreate = player.checkHandleProcsOnCastWithICD(currentTime, spellIndex, this.logger);
                this.addEventsToEventHeap(eventHeap, eventsToCreate);

                spellIndex += 1
            } else if (nextEvent._eventType === 'BUFF_EXPIRE') {
                // code here sets availableForUse to false; this is fine, as we have other code that checks for availability on next spellcast
                player.setBuffActive(nextEvent._subEvent, false, currentTime, this.logger);
            } else if (nextEvent._eventType === 'MANA_TICK') {
                this.handleManaTick(nextEvent, player, eventHeap, spellIndex);
            } else if (nextEvent._eventType === 'INITIALIZE_HOT_EVENTS') {
                this.initializeHotEvents(nextEvent, player, eventHeap);
            } else if (nextEvent._eventType === 'HOT_TICK') {
                this.handleHotTick(nextEvent, player, eventHeap, spellIndex);
            }


            player.checkOverflowMana();
            this.logger.log(`${player}\n----------`, 2);
        } //end while loop


        let statistics = player.calculateStatisticsAfterSimEnds(lastCastTimestamp),
            hps = Math.floor(player._statistics['overall']['healing'] / lastCastTimestamp);

        return {ttoom: lastCastTimestamp, statistics: statistics, logs: this.logger._resultArr, hps: hps, raidBuffedStats: player._statistics['raidBuffedStats']};
    }

    
    calculateCritTrimmedMean(data, percentageToTrim) {
        let toReturn = {},
            critCasts,
            totalCasts;

        for (let spell in data) {
            critCasts = 0;
            totalCasts = 0;

            // if (spell !== 'Holy Shock') continue;
            let newNumEntries = data[spell].length * (1 - percentageToTrim),
                startIndex = Math.floor((data[spell].length - newNumEntries) / 2);

            // sorts and trims based on crit %
            let sorted = data[spell].sort((a, b) => a['crit %'] - b['crit %']);
            sorted = sorted.splice(startIndex, newNumEntries);

            for (let i = 0; i < sorted.length; i++) {
                critCasts += sorted[i]['critCasts'];
                totalCasts += sorted[i]['totalCasts'];
            }
            toReturn[spell] = Utility.roundDp(critCasts / totalCasts * 100, 1);
        }
        return toReturn;
    }

    runBatch(batchSize=10, batchSeed=0, playerClass='paladin', logsLevel=0, numBins=30) {
        let timings = [], listOfHPS = [], manaGeneratedStatistics = [], spellsCastedStatistics = [],
            medianEntry, resultSingleLoop, binResults, raidBuffedStats;

        // if seed is 0, we get a random number from 1 to 9999 and used it to seed
        if (batchSeed === 0) {
            batchSeed = Math.floor(Math.random() * 10000 + 1)
        }

        // this is because we want a seed value that can be used to generate the exact log later
        for (let i = 0; i < batchSize; i++) {
            // passing batchSeed == 0 into runSingleLoop will mean it's random
            // thus, we multiply batchSeed by i + 1 instead
            resultSingleLoop = this.runSingleLoop(logsLevel, batchSeed * (i + 1), playerClass);
            manaGeneratedStatistics.push(resultSingleLoop['statistics']['manaGenerated']);
            spellsCastedStatistics.push(resultSingleLoop['statistics']['spellsCasted']);
            timings.push({ttoom: resultSingleLoop['ttoom'], seed: batchSeed * (i + 1)});
            listOfHPS.push(resultSingleLoop['hps']);
        }

        // this should be the same for all runs, so we just take the last run values
        raidBuffedStats = resultSingleLoop['raidBuffedStats'];

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


        let castProfileSummary = [],
            summaries = {};

        const METRICS = [
            {key: 'cpm', roundingMethod: '1dp'},
            {key: 'hpet', roundingMethod: 'floor'},
            {key: 'hps', roundingMethod: 'floor'},
            {key: 'avgManaCost', roundingMethod: 'floor'},
            {key: 'hpm', roundingMethod: 'floor'},
        ];

        // metrics are like cpm, avgManaCost, hpet, etc
        // for each key metric, we find the median value
        /* example would be
          cpm: [
            { spell: 'Chain Heal', cpm: 18.6 },
            { spell: 'Lesser Healing Wave', cpm: 8.3 },
            { spell: 'Riptide', cpm: 7.8 },
            { spell: 'Earth Shield', cpm: 1.1 },
            { spell: 'Healing Wave', cpm: 1 }
          ],
        */

        // it's better to sum up crit/total casts across all the entire batch before finding crit %
        // rather than trying to mean crit %, which is not as accurate
        let trimmedMeanData = {},
            critMeans;
        for (let _ of spellsCastedStatistics) {
            for (let row of _) {
                let key = row['spell'];
                if (typeof trimmedMeanData[key] === 'undefined') {
                    trimmedMeanData[key] = [];
                }
                // this is just used for sorting
                row['crit %'] = row['critCasts'] / row['totalCasts'];
                trimmedMeanData[key].push(row);
            }
        }
        // trims 10% of extreme values to reduce variance
        critMeans = this.calculateCritTrimmedMean(trimmedMeanData, 0.1);

        for (let metric of METRICS) {
            summaries[metric['key']] = Utility.medianStatistics(spellsCastedStatistics, 'spell', metric['key'], metric['roundingMethod']);
        };

        // loops through each of the spell, and pulls out the relevant metric for each one of them
        for (let _spell of summaries['cpm'].map((row) => row['spell'])) {
            let toAddToCastProfileSummary = {'SPELL': _spell};
            for (let metric of METRICS) {
                let key = metric['key'],
                    temp = {},
                    title = key, // what is actually shown on frontend
                    entry;

                entry = summaries[key].find((_m) => _m['spell'] === _spell);
                if (title === 'avgManaCost') {
                    title = 'COST';
                } else {
                    title = title.toUpperCase();
                }
                // adds thousand modifier if >= 1000
                toAddToCastProfileSummary[title] = entry[key] >= 1000 ? Utility.formatNumber(entry[key]) : entry[key];
            };
            // add crit % - this is not calculated via median, but instead is calculated by summing all the crit and dividing across all the normal casts
            // to reduce variance, we do a trimmed mean
            toAddToCastProfileSummary['CRIT %'] = critMeans[_spell];
            castProfileSummary.push(toAddToCastProfileSummary);
        }

        // console.log(critCasts, totalCasts, critCasts / totalCasts)

        // console.log('testing holy shocks')
        // console.log(Utility.sum(tempHolyShockCrits) / tempHolyShockCrits.length)
        // for (let i = 0; i < 4; i++) {
        //     console.log(tempHolyShockCrits.slice(i*100, (i+1) * 100))
        // }

        // we run a single iteration of the median seed to get log info
        // first argument is logLevel - 2 shows most details but ommits crti details
        // note that medianEntry['seed'] refers to the specific seed of that run and not the batchSeed
        resultSingleLoop = this.runSingleLoop(3, medianEntry['seed'], playerClass);
        // resultSingleLoop = this.runSingleLoop(1, medianEntry['seed'], playerClass);

        return {
            batchSeed: batchSeed,
            ttoom: medianEntry['ttoom'],
            hps: Utility.median(listOfHPS),
            raidBuffedStats: raidBuffedStats,
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
        let spellFinishCastingTimestamp;

        if (spellSelected['key'] === 'HEALING_WAVE' && player.isStackActive('tidalWaves')) {
            // tidalWave will reduce Healing Wave cast time by 30%
            // while not ideal to put here, fastest way; refactor in future
            spellFinishCastingTimestamp = currentTime + spellSelected['castTime'] * (1 - DATA['classes']['shaman']['tidalWaves']['hwCastTimeReduction']) + offset;
        } else {
            spellFinishCastingTimestamp = currentTime + spellSelected['castTime'] + offset;
        }

        // self.add_spell_cast_helper(event_heap, selected_spell['name'], is_crit, is_soup_proc, is_sow_proc, is_eog_proc, current_time, cast_time + offset)
        eventHeap.addEvent(spellFinishCastingTimestamp, 'SPELL_CAST', spellSelected['key']);
        return spellSelected;
    }
}

module.exports = Experiment;