const Experiment = require('./experiment');
const Paladin = require('../ttoom/paladin');
const EventHeap = require('../ttoom/eventheap');
const Utility = require('../common/utilities');
const Logger = require('../common/logger');

const DATA = require('../ttoom/gamevalues');

const thresholdItemsToCreate = ['crit', 'soup', 'eog', 'sow', 'dmcg'];
let rng = Utility.setSeed(0);

test('test replenishment subevent on handleManaTick', () => {
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    let experiment = new Experiment(options, 1);
    let eventHeap = new EventHeap();
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    player._currentMana = 10000;
    eventHeap.addEvent(2, 'MANA_TICK', 'replenishment');
    let replenishmentEvent = eventHeap.pop()
    // haven't added event to eventHeap
    expect(eventHeap.hasElements()).toBe(false);

    experiment.handleManaTick(replenishmentEvent, player, eventHeap);
    // checks that player has added some mana
    expect(player._currentMana).toBeGreaterThanOrEqual(10000 + player.maxMana * 0.01 / 5);


    // should add a new replenishment event 2s later
    expect(eventHeap.priorityQueue.length).toBe(1);
    let nextEvent = eventHeap.pop();
    expect(nextEvent._timestamp).toBe(4);
});

// singular innervate tick
test('test innervate subevent on handleManaTick', () => {
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    let experiment = new Experiment(options, 1);
    let eventHeap = new EventHeap();
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    player._currentMana = 10000;
    eventHeap.addEvent(2, 'MANA_TICK', 'INNERVATE');
    let innervateEvent = eventHeap.pop();

    experiment.handleManaTick(innervateEvent, player, eventHeap);
    // we code innervate to be 5 ticks of 1573
    expect(player._currentMana).toBe(10000 + 1573);
    // should expect no events added
    expect(eventHeap.priorityQueue.length).toBe(0);
});

// singular divine plea tick
test('test divine plea subevent on handleManaTick', () => {
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    let experiment = new Experiment(options, 1);
    let eventHeap = new EventHeap();
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    player._currentMana = 10000;
    eventHeap.addEvent(2, 'MANA_TICK', 'DIVINE_PLEA');
    let divinePleaEvent = eventHeap.pop();

    experiment.handleManaTick(divinePleaEvent, player, eventHeap);
    // we code innervate to be 5 ticks of 5% mana
    expect(player._currentMana).toBe(10000 + player.maxMana * 0.05);
    // should expect no events added
    expect(eventHeap.priorityQueue.length).toBe(0);
});

// singular divine plea tick
test('test owl subevent on handleManaTick', () => {
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    let experiment = new Experiment(options, 1);
    let eventHeap = new EventHeap();
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    player._currentMana = 10000;
    eventHeap.addEvent(2, 'MANA_TICK', 'OWL');
    let owlEvent = eventHeap.pop();

    experiment.handleManaTick(owlEvent, player, eventHeap);
    // we code innervate to be 5 ticks of 5% mana
    expect(player._currentMana).toBe(10000 + 390);
    // should expect no events added
    expect(eventHeap.priorityQueue.length).toBe(0);
});

test('test MANA_TIDE_TOTEM subevent on handleOffGcdManaCooldown', () => {
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    let experiment = new Experiment(options, 1);
    let eventHeap = new EventHeap();
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    player._currentMana = 10000;
    eventHeap.addEvent(10, 'MANA_COOLDOWN_OFF_GCD', 'MANA_TIDE_TOTEM');
    let manaTideTotemEvent = eventHeap.pop();

    experiment.handleOffGcdManaCooldown(manaTideTotemEvent, eventHeap);
    expect(eventHeap.priorityQueue.length).toBe(4);
    let evt = eventHeap.pop();
    expect(evt._timestamp).toBe(13);
    expect(evt._eventType).toBe('MANA_TICK');
    expect(evt._subEvent).toBe('MANA_TIDE_TOTEM');
});


test('test creation of sacred shield on initializeHotEvents', () => {
    let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
    let experiment = new Experiment(options, 1);
    experiment.logger = new Logger();
    let eventHeap = new EventHeap();
    let player = new Paladin(options, rng, thresholdItemsToCreate);
    eventHeap.addEvent(60, 'INITIALIZE_HOT_EVENTS', 'SACRED_SHIELD');
    let sacredShieldCreationEvent = eventHeap.pop();

    experiment.initializeHotEvents(sacredShieldCreationEvent, player, eventHeap);
    // should expect 10 hot tick events to be added
    expect(eventHeap.priorityQueue.length).toBe(10);
    let hotEvent = eventHeap.pop();
    expect(hotEvent._timestamp).toBe(66);
    expect(hotEvent._subEvent).toBe('SACRED_SHIELD');

    experiment.handleHotTick(hotEvent, player, eventHeap, 1);
});
