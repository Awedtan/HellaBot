const { fetchRanges } = require('./fetchData.js');

module.exports = {
    createRangeEmbedField(rangeId) {
        console.log(rangeId);
        const rangeDict = fetchRanges();
        const rangeGrid = rangeDict[rangeId].grids;
        
        let left = 0, right = 0, top = 0, bottom = 0;
        for (const square of rangeGrid) {
            if (square.col < left)
                left = square.col
            else if (square.col > right)
                right = square.col;
            if (square.row < bottom)
                bottom = square.row
            else if (square.row > top)
                top = square.row;
        }

        const arrCols = right - left + 1;
        const arrRows = top - bottom + 1;
        const rangeArr = new Array(arrCols);
        for (let i = 0; i < arrCols; i++) {
            rangeArr[i] = new Array(arrRows);
        }
        for (const square of rangeGrid) {
            rangeArr[square.col - left][-square.row - bottom] = 1;
        }
        rangeArr[-left][-bottom] = 2;

        let rangeString = '';
        for (let i = 0; i < arrRows; i++) {
            for (let j = 0; j < arrCols; j++) {
                switch (rangeArr[j][i]) {
                    case (1):
                        rangeString += '🔳';
                        break;
                    case (2):
                        rangeString += '🟦';
                        break;
                    default:
                        rangeString += '⬛';
                        break;
                }
            }
            rangeString += '\n';
        }
        return { name: 'Range', value: rangeString };
    },
    formatTextBlackboardTags(text, blackboard) {
        const skillKeys = {};
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
        const tagRegex = /<.ba\.[^<]+>|:0%|:0|:0.0%/;
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