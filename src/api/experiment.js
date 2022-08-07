const seedrandom = require('seedrandom');

const EventHeap = require('../common/eventheap');
const Paladin = require('../common/paladin');
const DATA = require('../common/gamevalues');

class Logger {
    constructor(logLevel) {
        this._logLevel = logLevel;
    }

    // logs message if logger's level exceeds minLogLevel
    log(message, minLogLevel) {
        if (this._logLevel >= minLogLevel) {
            console.log(message);
        }
    }
}

class Experiment {
    constructor(playerOptions) {
        if (playerOptions['trinkets'].length > 2) {
            throw new Error('Please select no more than two trinkets');
        }
        this._playerOptions = playerOptions;
    }

    // # if spellcast is an instant, it returns an offset timing that is equivalent to GCD

    // handleSpellCastEvent(player, currentTime) {
    //     console.log('handling spell cast');
    //     player.castSpell()
        // status, err_message, offset_timing = self.handle_spellcast(next_event, player)


                // status, err_message, offset_timing = self.handle_spellcast(next_event, player)
                // # checks that player is not oom
                // if status == 0:
                //     if self._logs_level == 2:
                //         print(err_message)
                //     break

                // # not oom, so continue the simulation
                // cooldown_used = player.use_mana_cooldown(current_time)
                // divine_plea_offset = 0
                // # divine plea is on gcd, so we need to delay the next spell cast
                // if cooldown_used == 'DIVINE_PLEA':
                //     divine_plea_offset = self._options['GCD']
                //     for i in range(1, 6):
                //         heapq.heappush(event_heap, Event('Divine Plea', False, False, False, False, current_time + i * 3, 'DIVINE_PLEA_TICK'))
                // # off gcd since shaman is the one using
                // elif cooldown_used == 'MANA_TIDE_TOTEM':
                //     for i in range(1, 5):
                //         heapq.heappush(event_heap, Event('Mana Tide Totem', False, False, False, False, current_time + i * 3, 'MANA_TIDE_TOTEM_TICK'))
                    
                // self.select_and_add_spell_cast(event_heap, player, current_time + divine_plea_offset, spell_index, offset_timing)
                // spell_index += 1

       

    // }

    // seeding rng if a seed is passed in (default is 0, which means user didnt pass in)
    // otherwise just use random seed
    setSeed(seed) {
        let curr = new Date();
        let rng;
        if (seed > 0) {
            rng = seedrandom(seed);
        } else {
            rng = seedrandom(Math.random());
        }
        return rng;
    }

    // seed === 0 means we don't use a seed
    runSingleLoop(logsLevel=0, seed=0, maxMinsToOOM=10) {
        let rng = this.setSeed(seed);
        this.logger = new Logger(logsLevel);

        // rather than saving player/eventHeap to experiement, we recreate it each time we run a loop
        // this ensures that we are always starting anew when we run a loop
        // makes a copy of playerOptions to avoid bugs where we override the original options
        let player = new Paladin(Object.assign({}, this._playerOptions));
        // KIV -> think about if this is extendable for other classes. sow (seal of wisdom is a pally only thing for instance)
        player.createRngThresholds(rng, ['crit', 'soup', 'eog', 'sow', 'dmcg'], maxMinsToOOM);
        let eventHeap = new EventHeap();
        let currentTime = 0,
            lastCastTimestamp = 0,
            spellIndex = 0,
            spellSelected = null,
            nextEvent = null,
            status, errorMessage, offset;

        // assume first cast is always holy light
        spellSelected = this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, 0, this._playerOptions['firstSpell']);
        while (eventHeap.hasElements() && currentTime <= maxMinsToOOM * 60) {
            nextEvent = eventHeap.pop();
            currentTime = nextEvent._timestamp;

            if (nextEvent._eventType === 'SPELL_CAST') {
                [status, errorMessage, offset] = player.castSpell(nextEvent._subEvent, currentTime, spellIndex, this.logger);

                // ends simulation if player is oom
                if (status == 0) {
                    this.logger.log(errorMessage, 2);
                    break;
                }

                // not oom, so continue the simulation
                // cooldown_used = player.use_mana_cooldown(current_time)
                // divine_plea_offset = 0
                // # divine plea is on gcd, so we need to delay the next spell cast
                // if cooldown_used == 'DIVINE_PLEA':
                //     divine_plea_offset = self._options['GCD']
                //     for i in range(1, 6):
                //         heapq.heappush(event_heap, Event('Divine Plea', False, False, False, False, current_time + i * 3, 'DIVINE_PLEA_TICK'))
                // # off gcd since shaman is the one using
                // elif cooldown_used == 'MANA_TIDE_TOTEM':
                //     for i in range(1, 5):
                //         heapq.heappush(event_heap, Event('Mana Tide Totem', False, False, False, False, current_time + i * 3, 'MANA_TIDE_TOTEM_TICK'))
                    
                // adds next spell to simulation
                this.selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, offset);
                // self.select_and_add_spell_cast(event_heap, player, current_time + divine_plea_offset, spell_index, offset_timing)
                spellIndex += 1
            }

            this.logger.log(`${player}\n----------`, 2);
        } //end while loop
    }

    selectSpellAndToEventHeapHelper(eventHeap, player, currentTime, spellIndex, offset, overrideSpellSelection='') {
        let spellSelected = player.selectSpell(currentTime, spellIndex, overrideSpellSelection);
        let spellFinishCastingTimestamp = currentTime + spellSelected['castTime'] + offset;

        // self.add_spell_cast_helper(event_heap, selected_spell['name'], is_crit, is_soup_proc, is_sow_proc, is_eog_proc, current_time, cast_time + offset)
        eventHeap.addEvent(spellFinishCastingTimestamp, 'SPELL_CAST', spellSelected['key']);
        return spellSelected;
    }
}

module.exports = Experiment;


//         while len(event_heap) > 0 and current_time <= self._options['MAX_TIME_TO_OOM']:
//             next_event = heapq.heappop(event_heap)
//             current_time = next_event._time
//             # used when we cast an instant spell
//             gcd_locked = False

//             # we want dmcg to expire exactly after 15s
//             # if we do a check only when we have events, we might give dmcg a longer buff than 15s
//             if next_event._event_type == 'DMCG_BUFF_INACTIVE':
//                 player.check_dmcg_available_for_use(current_time)
//                 continue

//             # we should check at the start of every event loop if dmcg buff has available for use
//             if self._options['dmcg']:
//                 player.check_dmcg_available_for_use(current_time)

//             # we handle cooldown and spell cast in same function
//             # note that we need to handle the next_event spell first before considering mana cooldown
//             # also note that we handle divine plea like a mana cooldown rather than spell
//             # this is because next_event represents the end of the spell (so we can't use a cooldown)
//             if next_event._event_type == 'SPELL_CAST':
//                 last_cast_timestamp = current_time

//                 # handles current spell cast
//                 # if spellcast is an instant, it returns an offset timing that is equivalent to GCD
//                 status, err_message, offset_timing = self.handle_spellcast(next_event, player)
//                 # checks that player is not oom
//                 if status == 0:
//                     if self._logs_level == 2:
//                         print(err_message)
//                     break

//                 # not oom, so continue the simulation
//                 cooldown_used = player.use_mana_cooldown(current_time)
//                 divine_plea_offset = 0
//                 # divine plea is on gcd, so we need to delay the next spell cast
//                 if cooldown_used == 'DIVINE_PLEA':
//                     divine_plea_offset = self._options['GCD']
//                     for i in range(1, 6):
//                         heapq.heappush(event_heap, Event('Divine Plea', False, False, False, False, current_time + i * 3, 'DIVINE_PLEA_TICK'))
//                 # off gcd since shaman is the one using
//                 elif cooldown_used == 'MANA_TIDE_TOTEM':
//                     for i in range(1, 5):
//                         heapq.heappush(event_heap, Event('Mana Tide Totem', False, False, False, False, current_time + i * 3, 'MANA_TIDE_TOTEM_TICK'))
                    
//                 self.select_and_add_spell_cast(event_heap, player, current_time + divine_plea_offset, spell_index, offset_timing)
//                 spell_index += 1

//             # mana tick (assume 5s intervals for now as unsure as has this changed from classic)
//             elif next_event._event_type == 'MANA_TICK':
//                 mana_tick_amount = player.add_mana_regen_from_replenishment_and_other_mp5()
//                 if self._logs_level == 2:
//                     print(f'{current_time}s: Mana tick for {mana_tick_amount}')
//                 self.add_mana_tick(event_heap, current_time + self._mana_tick_interval)

//             elif next_event._event_type == 'DIVINE_PLEA_TICK':
//                 divine_plea_tick_amount = player.add_mana_from_divine_plea()
//                 if self._logs_level == 2:
//                     print(f'{current_time}s: Divine Plea tick for {divine_plea_tick_amount}')

//             elif next_event._event_type == 'MANA_TIDE_TOTEM_TICK':
//                 mana_tide_totem_tick_amount = player.add_mana_from_mana_tide_totem()
//                 if self._logs_level == 2:
//                     print(f'{current_time}s: Mana tide totem tick for {mana_tide_totem_tick_amount}')
            

//             if self._logs_level == 2:
//                 print(player)
//                 print('-'*10)


// // def select_and_add_spell_cast(self, event_heap, player, current_time, spell_index, offset, override_spell_selection=''):
// //     # selects next spell
// //     selected_spell = player.select_spell(current_time, override_spell_selection)

// //     cast_time = self._options['CAST_TIMES'][selected_spell['key']]
// //     # adding next spell cast
// //     crit_chance = player._crit_chance
// //     # 10% additional crit chance to holy shock
// //     if selected_spell['key'] == 'HOLY_SHOCK' and self._options['2p_t7']:
// //         crit_chance += 0.1
// //     if selected_spell['key'] == 'HOLY_LIGHT' and player._buffs['INFUSION_OF_LIGHT']:
// //         player._buffs['INFUSION_OF_LIGHT'] = False
// //         crit_chance += 0.2

// //     if self._logs_level == 3:
// //         print('Crit chance of next spell: {}; {}'.format(selected_spell['key'], crit_chance))
// //     is_crit = self.crit_rng_thresholds[spell_index] <= crit_chance

// //     # holy shock crits triggers infusion of light, which adds 20% to next HL crit
// //     if selected_spell['key'] == 'HOLY_SHOCK' and is_crit:
// //         player._buffs['INFUSION_OF_LIGHT'] = True

// //     # print('{}; crit_chance: {}'.format(selected_spell['key'], crit_chance))
// //     # soup_proc of next spell based off the current spell
// //     # holy shock only has 2 soup procs
// //     # both eog and soup share same number of hits
// //     num_chances_for_soup = self._num_hits_per_holy_light if selected_spell['key'] == 'HOLY_LIGHT' else 2
// //     is_soup_proc = self.get_soup_eog_proc(self.soup_rng_thresholds[spell_index * num_chances_for_soup: (spell_index + 1) * num_chances_for_soup], 'soup')
// //     is_eog_proc = self.get_soup_eog_proc(self.eog_rng_thresholds[spell_index * num_chances_for_soup: (spell_index + 1) * num_chances_for_soup], 'eog')
// //     # checks and see if dmcg is proc
// //     is_dmcg_proc = self.dmcg_rng_thresholds[spell_index] <= TRINKET_STATS['dmcg_proc_rate'] if self._options['dmcg'] else False
// //     if is_dmcg_proc and player.check_dmcg_available(current_time):
// //         player.set_dmcg_active(True, current_time)
// //         heapq.heappush(event_heap, Event('DMCG Buff Inactive', False, False, False, False, current_time + 15, 'DMCG_BUFF_INACTIVE'))

// //     is_sow_proc = self.sow_rng_thresholds[spell_index] <= SOW_PROC_RATE
// //     if self._logs_level == 3 and selected_spell['key'] == 'HOLY_SHOCK' and is_sow_proc:
// //         print('SOW PROC FOR UPCOMING HOLY SHOCK')
// //     self.add_spell_cast_helper(event_heap, selected_spell['name'], is_crit, is_soup_proc, is_sow_proc, is_eog_proc, current_time, cast_time + offset)