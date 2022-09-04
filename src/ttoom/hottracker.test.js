const EventHeap = require('../ttoom/eventheap');
const HotTracker = require('./hottracker');

test('test creation of hottracker and trackHot', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');

    hotTracker.trackHot('RIPTIDE', 3, 5, 2);
    expect(hotTracker._data['RIPTIDE'].length).toBe(1);
});

test('test canConsumeHot', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');

    expect(hotTracker.canConsume('RIPTIDE', 8)).toBe(false);
    hotTracker.trackHot('RIPTIDE', 3, 5, 2);
    expect(hotTracker.canConsume('RIPTIDE', 8)).toBe(false);
    expect(hotTracker.canConsume('RIPTIDE', 12)).toBe(true);
});

test('test consumeHot', () => {
    let eventHeap = new EventHeap();
    let hotTracker = new HotTracker(eventHeap, 'shaman');
    eventHeap.addIntervalEvents(3, 'HOT_TICK', 'RIPTIDE', 5, 3, false, 0);
    hotTracker.trackHot('RIPTIDE', 0, 0, 2);
    expect(eventHeap.priorityQueue.length).toBe(5);
    expect(hotTracker._data['RIPTIDE'].length).toBe(1);

    // should remove from eventHeap as well
    hotTracker.consume('RIPTIDE', 12);
    expect(hotTracker._data['RIPTIDE'].length).toBe(0);
    expect(eventHeap.priorityQueue.length).toBe(0);
});

// // singular innervate tick
// test('test innervate subevent on handleManaTick', () => {
//     let options = JSON.parse(JSON.stringify(DATA['classes']['paladin']['defaultValues']));
//     let experiment = new Experiment(options, 1);
//     let eventHeap = new EventHeap();
//     let player = new Paladin(options, rng, thresholdItemsToCreate);
//     player._currentMana = 10000;
//     eventHeap.addEvent(2, 'MANA_TICK', 'INNERVATE');
//     let innervateEvent = eventHeap.pop();

//     experiment.handleManaTick(innervateEvent, player, eventHeap);
//     // we code innervate to be 5 ticks of 1573
//     expect(player._currentMana).toBe(10000 + 1573);
//     // should expect no events added
//     expect(eventHeap.priorityQueue.length).toBe(0);
// });
