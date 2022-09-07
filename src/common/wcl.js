const Utility = require('../common/utilities');

/**
 *  - Helper class that handles calls to WCL
 */

class WclReader {
    // given a link, we try to split into code, sourceId and fightId
    constructor(wclLink) {
        this._defaultLinkData = {
            'url': wclLink,
            'code': '',
            'sourceId': -99,
            'fightId': -99,
        }

        let getWclCodeRegex = '',
            found = false;

        if (wclLink.indexOf('source=') > - 1) {
            getWclCodeRegex = /(.*reports\/)?(\w{16}).*source=(\d+).*/;
            found = wclLink.match(getWclCodeRegex);
            this._defaultLinkData['sourceId'] = Number(found[3]);
        } else {
            getWclCodeRegex = /(.*reports\/)?(\w{16}).*/;
            found = wclLink.match(getWclCodeRegex);
        }

        this._defaultLinkData['code'] = found[2];

        // careful - if user passes in 'last', this means final boss fight
        if (wclLink.indexOf('fight=') > - 1) {
            if (wclLink.indexOf('fight=last') > -1) {
                this._defaultLinkData['fightId'] = 'last'
            } else {
                let sourceIdFound = wclLink.match(/.*fight=(\d+).*/)
                this._defaultLinkData['fightId'] = Number(sourceIdFound[1]);
            }
        }
    }

}
module.exports = WclReader;