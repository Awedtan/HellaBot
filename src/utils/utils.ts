import { Blackboard } from "./types";

module.exports = {
    cleanFilename(text: string) {
        text = text.split(/[#\+]|&|\[|\]/).join('');
        return text;
    },
    formatBlackboardText(text: string, blackboard: Blackboard[]) {
        if (text === null) return '';
        if (blackboard === null) blackboard = [];

        text = text.trim();
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

        const endTagRegex = /<\/[^<]*>/;
        const tagRegex = /<.[a-z]{2,5}?\.[^<]+>|<color=[^<]*>|(?:^0-9):0|:0%|:0.0%/;
        text = text.split(endTagRegex).join('').split(tagRegex).join('');

        const temp = text.split(/-?{-?|}/);

        for (let i = 0; i < temp.length; i++) {
            if (skillKeys.hasOwnProperty(temp[i].toLowerCase())) {
                temp[i] = `\`${skillKeys[temp[i].toLowerCase()]}\``;
            }
        }
        text = temp.join('');
        return text;
    }
}