const { fetchRanges } = require('./fetchData');

import { Blackboard, Range } from "./types";

module.exports = {
    formatTextBlackboardTags(text: string, blackboard: Blackboard[]) {
        const skillKeys: { [key: string]: number | string } = {};
        for (const stat of blackboard) {
            const key = stat.key;
            const value = stat.value;

            if (text.charAt(text.indexOf(key) + key.length) === ':') {
                skillKeys[key] = `${Math.round(value * 100)}%`;
            }
            else {
                skillKeys[key] = value;
            }
        }

        const endTagRegex = /<\/>/;
        const tagRegex = /<.ba\.[^<]+>|:0%|:0|:0.0%|-/;
        text = text.split(endTagRegex).join('').split(tagRegex).join('');

        const temp = text.split(/{|}/);

        for (let i = 0; i < temp.length; i++) {
            if (skillKeys.hasOwnProperty(temp[i].toLowerCase())) {
                temp[i] = `\`${skillKeys[temp[i].toLowerCase()]}\``;
            }
        }
        text = temp.join('');
        return text;
    }
}