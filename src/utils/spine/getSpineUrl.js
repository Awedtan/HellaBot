async function getSpineUrl(type, id, set) {
    const urlExists = async url => (await fetch(url)).status === 200;
    const myAssetUrl = "https://raw.githubusercontent.com/Awedtan/HellaAssets/main";
    const enemySpineIdOverride = {
        "enemy_1037_lunsbr": "enemy_1037_lunsabr",
        "enemy_1043_zomsbr": "enemy_1043_zomsabr",
        "enemy_1043_zomsbr_2": "enemy_1043_zomsabr_2'"
    };

    let spinePath = null;
    id = encodeURIComponent(id);

    if (type === 'operator') {
        if (set === 'build') {
            spinePath = `${myAssetUrl}/spine/${type}/${set}/build_${id}/build_${id}`
            if (!await urlExists(spinePath + '.skel')) {
                if (await urlExists(spinePath.split('build_').join('Build_') + '.skel')) { // Capitalize Build_
                    spinePath = spinePath.split('build_').join('Build_');
                }
                else if (await urlExists(spinePath.split('char_').join('Char_') + '.skel')) { // Capitalize Char_
                    spinePath = spinePath.split('char_').join('Char_');
                }
                else if (await urlExists(spinePath.split('build_').join('') + '.skel')) { // Remove build_
                    spinePath = spinePath.split('build_').join('');
                }
            }
        }
        else {
            spinePath = `${myAssetUrl}/spine/${type}/battle/${id}/${set}/${id}`;
        }
    }
    else {
        id = enemySpineIdOverride[id] ?? id;
        spinePath = `${myAssetUrl}/spine/${type}/${id}/${id}`;
        if (!await urlExists(spinePath + '.skel')) {
            id = id.split(/_[^_]+$/).join('');
            spinePath = `${myAssetUrl}/spine/${type}/${id}/${id}` // Take out trailing _asdf
        }
    }

    if (!await urlExists(spinePath + '.skel'))
        throw new Error('Skel file can\'t be found: ' + spinePath);
    return spinePath;
}

module.exports = { getSpineUrl };