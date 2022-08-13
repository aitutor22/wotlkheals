const Utility = require('./utilities');

/* 
    Given a particular cast profile that doesn't contain any cooldown spells (e.g. 30 HL and 10 FoL)
    creates a spell queue that determines which spell to cast
    Firstly, we want to break down the cast profile into the smallest sequence
    For instance, the above cast profile is basically 3 HL to 1 FoL

*/
class SpellQueue {
    constructor(castProfile, rng) {
        this._baseCastProfile = castProfile;
        this._rng = rng;
        [this._simplifiedCastProfile, this._sequence] = this.createSimplifiedCastProfile(rng);
    }

    // https://codereview.stackexchange.com/questions/166358/finding-the-greatest-common-factor-of-a-list-of-numbers-in-javascript
    // gcd stands for greatest common divisor
    gcd(x, y) {
        return (!y) ? x : this.gcd(y, (x % y)); 
    }

    findGCFofList(list) {
        let gcd = this.gcd.bind(this);
        return list.reduce(gcd)
    }
    
    // creates both the simplifiedCastProfile, and the sequence
    // simplifiedCastProfile of 30 HL, 10 FoL is 3Hl and 1 FoL
    // and sequence could be ['HOLY_LIGHT', 'HOLY_LIGHT', 'FLASH_OF_LIGHT', 'HOLY_LIGHT',]
    createSimplifiedCastProfile() {
        let simplifiedCastProfile = {}, sequence = [], dividingFactor = 1;
        if (Object.keys(this._baseCastProfile).length === 1) {
            let key = Object.keys(this._baseCastProfile)[0];
            simplifiedCastProfile[key] = 1;
            sequence.push(key);
        } else {
            dividingFactor = this.findGCFofList(Object.values(this._baseCastProfile));

            for (let key in this._baseCastProfile) {
                simplifiedCastProfile[key] = Math.floor(this._baseCastProfile[key] / dividingFactor);

                for (let i = 0; i < simplifiedCastProfile[key]; i++) {
                    sequence.push(key);
                }
            }
        }
        // randomly shuffles sequence inplace using the rng function passed in
        Utility.shuffleArray(sequence, this._rng);
        return [simplifiedCastProfile, sequence];
    }

}

module.exports = SpellQueue;