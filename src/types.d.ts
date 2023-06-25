export type AttributesKeyFrame = {
    level: number;
    data: {
        maxHp: number;
        atk: number;
        def: number;
        magicResistance: number;
        cost: number;
        blockCnt: number;
        moveSpeed: number;
        attackSpeed: number;
        baseAttackTime: number;
        respawnTime: number;
        hpRecoveryPerSec: number;
        spRecoveryPerSec: number;
        maxDeployCount: number;
        maxDeckStackCnt: number;
        tauntLevel: number;
        massLevel: number;
        baseForceLevel: number;
        stunImmune: boolean;
        silenceImmune: boolean;
        sleepImmune: boolean;
        frozenImmune: boolean;
        levitateImmune: boolean;
    };
};

type Blackboard = {
    key: string;
    value: number;
    valueStr: string;
};

type Base = {
    buffId: string;
    buffName: string;
    buffIcon: string;
    skillIcon: string;
    sortId: number;
    buffColor: string;
    textColor: string;
    buffCategory: string;
    roomType: string;
    description: string;
};

type BaseInfo = {
    buffId: string;
    cond: OperatorUnlockCond;
};

type CCStage = {
    const: {
        code: string;
        location: string;
        name: string;
        description: string;
    }
    levels: StageData;
};

type Definition = {
    termId: string;
    termName: string;
    description: string;
};

type Enemy = {
    excel: {
        enemyId: string;
        enemyIndex: string;
        enemyTags: string[];
        sortId: number;
        name: string;
        enemyRace: string;
        enemyLevel: string;
        description: string;
        attackType: string;
        endure: string;
        attack: string;
        defence: string;
        resistance: string;
        ability: string;
        isInvalidKilled: boolean;
        overrideKillCntInfos: {};
        hideInHandbook: boolean;
    };
    levels: {
        Key: string;
        Value: {
            level: number;
            enemyData: {
                name: {
                    m_defined: boolean;
                    m_value: string;
                };
                description: {
                    m_defined: boolean;
                    m_value: string;
                };
                prefabKey: {
                    m_defined: boolean;
                    m_value: string;
                };
                attributes: EnemyAttributes;
                lifePointReduce: {
                    m_defined: boolean;
                    m_value: number;
                };
                levelType: {
                    m_defined: boolean;
                    m_value: number;
                };
                rangeRadius: {
                    m_defined: boolean;
                    m_value: number;
                };
                numOfExtraDrops: {
                    m_defined: boolean;
                    m_value: number;
                };
                talentBlackboard: Blackboard[];
                skills: EnemySkills[];
                spData: EnemySpData;
            };
        }[];
    };
};

type EnemyAttributes = {
    maxHp: {
        m_defined: boolean;
        m_value: number;
    };
    atk: {
        m_defined: boolean;
        m_value: number;
    };
    def: {
        m_defined: boolean;
        m_value: number;
    };
    magicResistance: {
        m_defined: boolean;
        m_value: number;
    };
    cost: {
        m_defined: boolean;
        m_value: number;
    };
    blockCnt: {
        m_defined: boolean;
        m_value: number;
    };
    moveSpeed: {
        m_defined: boolean;
        m_value: number;
    };
    attackSpeed: {
        m_defined: boolean;
        m_value: number;
    };
    baseAttackTime: {
        m_defined: boolean;
        m_value: number;
    };
    respawnTime: {
        m_defined: boolean;
        m_value: number;
    };
    hpRecoveryPerSec: {
        m_defined: boolean;
        m_value: number;
    };
    spRecoveryPerSec: {
        m_defined: boolean;
        m_value: number;
    };
    maxDeployCount: {
        m_defined: boolean;
        m_value: number;
    };
    massLevel: {
        m_defined: boolean;
        m_value: number;
    };
    baseForceLevel: {
        m_defined: boolean;
        m_value: number;
    };
    tauntLevel: {
        m_defined: boolean;
        m_value: number;
    };
    stunImmune: {
        m_defined: boolean;
        m_value: boolean;
    };
    silenceImmune: {
        m_defined: boolean;
        m_value: boolean;
    };
    sleepImmune: {
        m_defined: boolean;
        m_value: boolean;
    };
    frozenImmune: {
        m_defined: boolean;
        m_value: boolean;
    };
    levitateImmune: {
        m_defined: boolean;
        m_value: boolean;
    };
};

type EnemySkills = {
    prefabKey: string;
    priority: number;
    cooldown: number;
    initCooldown: number;
    spCost: number;
    blackboard: Blackboard[];
};

type EnemySpData = {
    spType: number;
    maxSp: number;
    initSp: number;
    increment: number;
};

type ManufactFormula = {
    formulaId: string;
    itemId: string;
    count: number;
    weight: number;
    costPoint: number;
    formulaType: string;
    buffType: string;
    costs: LevelUpCost[];
    requireRooms: {
        roomId: string;
        roomLevel: number;
        roomCount: number;
    }[];
    requireStages: {
        stageId: string,
        rank: number
    }[];
};

type WorkshopFormula = {
    sortId: number;
    formulaId: string;
    rarity: number;
    itemId: string;
    count: number;
    goldCost: number;
    apCost: number;
    formulaType: string;
    buffType: string;
    extraOutcomeRate: number;
    extraOutcomeGroup: {
        weight: number;
        itemId: string;
        itemCount: number;
    }[];
    costs: LevelUpCost[];
    requireRooms: {
        roomId: string;
        roomLevel: number;
        roomCount: number;
    }[];
    requireStages: {
        stageId: string,
        rank: number
    }[];
};

type Item = {
    data: {
        itemId: string;
        name: string;
        description: string;
        rarity: number;
        iconId: string;
        overrideBkg: null;
        stackIconId: string;
        sortId: number;
        usage: string;
        obtainApproach: string;
        classifyType: string;
        itemType: string;
        stageDropList: {
            stageId: string;
            occPer: string;
        }[];
        buildingProductList: {
            roomType: string;
            formulaId: string;
        }[];
    };
    formula: ManufactFormula | WorkshopFormula;
};

type LevelUpCost = {
    id: string;
    count: number;
    type: string;
};

type LevelUpCostCond = {
    unlockCond: OperatorUnlockCond;
    lvlUpTime: number;
    levelUpCost: LevelUpCost[];
};

type Module = {
    info: {
        uniEquipId: string;
        uniEquipName: string;
        uniEquipIcon: string;
        uniEquipDesc: string;
        typeIcon: string;
        typeName1: string;
        typeName2: string;
        equipShiningColor: string;
        showEvolvePhase: number;
        unlockEvolvePhase: number;
        charId: string;
        tmplId: string;
        showLevel: number;
        unlockLevel: number;
        unlockFavorPoint: number;
        missionList: string[];
        itemCost: { [key: string]: LevelUpCost[]; };
        type: string;
        uniEquipGetTime: number;
        charEquipOrder: number;
    };
    data: {
        phases: {
            equipLevel: number;
            parts: {
                resKey: string;
                target: string;
                isToken: boolean;
                addOrOverrideTalentDataBundle: {
                    candidates: {
                        displayRangeId: boolean;
                        upgradeDescription: string;
                        talentIndex: number;
                        unlockCondition: OperatorUnlockCond;
                        requiredPotentialRank: number;
                        prefabKey: string;
                        name: string;
                        description: string;
                        rangeId: string;
                        blackboard: Blackboard[];
                    }[];
                };
                overrideTraitDataBundle: {
                    candidates: {
                        additionalDescription: string;
                        unlockCondition: OperatorUnlockCond;
                        requiredPotentialRank: number;
                        blackboard: Blackboard[];
                        overrideDescripton: string;
                        prefabKey: string;
                        rangeId: string;
                    }[];
                };
            }[];
            attributeBlackboard: Blackboard[];
            tokenAttributeBlackboard: { [key: string]: Blackboard[]; };
        }[];
    };
};

type Operator = {
    id: string;
    recruitId: number;
    modules: string[];
    bases: BaseInfo[];
    data: {
        name: string;
        description: string;
        canUseGeneralPotentialItem: boolean;
        potentialItemId: string;
        nationId: string;
        groupId: string;
        teamId: string;
        displayNumber: string;
        tokenKey: string;
        appellation: string;
        position: string;
        tagList: string[];
        itemUsage: string;
        itemDesc: string;
        itemObtainApproach: string;
        isNotObtainable: boolean;
        isSpChar: boolean;
        maxPotentialLevel: number;
        rarity: number;
        profession: string;
        subProfessionId: string;
        trait: {
            candidates: {
                unlockCondition: OperatorUnlockCond;
                requiredPotentialRank: number;
                blackboard: Blackboard[];
                overrideDescripton: string;
                prefabKey: string;
                rangeId: string;
            }[];
        };
        phases: {
            characterPrefabKey: string;
            rangeId: string;
            maxLevel: number;
            attributesKeyFrames: AttributesKeyFrame[];
            evolveCost: LevelUpCost[];
        }[];
        skills: {
            skillId: string;
            overridePrefabKey: string;
            overrideTokenKey: string;
            levelUpCostCond: LevelUpCostCond[];
            unlockCond: OperatorUnlockCond;
        }[];
        talents: {
            candidates: {
                unlockCondition: OperatorUnlockCond;
                requiredPotentialRank: number;
                prefabKey: string;
                name: string;
                description: string;
                rangeId: string;
                blackboard: Blackboard[];
            }[];
        }[];
        potentialRanks: {
            type: number;
            description: string;
            buff: {
                attributes: {
                    abnormalFlags: null;
                    abnormalImmunes: null;
                    abnormalAntis: null;
                    abnormalCombos: null;
                    abnormalComboImmunes: null;
                    attributeModifiers: {
                        attributeType: number;
                        formulaItem: number;
                        value: number;
                        loadFromBlackboard: boolean;
                        fetchBaseValueFromSourceEntity: boolean;
                    }[];
                };
            };
            equivalentCost: null;
        }[];
        favorKeyFrames: AttributesKeyFrame[];
        allSkillLvlup: {
            unlockCond: OperatorUnlockCond;
            lvlUpCost: LevelUpCost[];
        }[];
    };
};

type OperatorUnlockCond = {
    phase: number;
    level: number;
};

type Paradox = {
    excel: ParadoxInfo;
    levels: StageData;
};

type ParadoxInfo = {
    charId: string;
    stageId: string;
    levelId: string;
    zoneId: string;
    code: string;
    name: string;
    loadingPicId: string;
    description: string;
    unlockParam: {
        unlockType: number;
        unlockParam1: string;
        unlockParam2: string;
        unlockParam3: null;
    }[];
    rewardItem: {
        id: string;
        count: number;
        type: string;
    }[];
    stageNameForShow: string;
    zoneNameForShow: string;
    picId: string;
    stageGetTime: number;
};

type Range = {
    id: string;
    direction: number;
    grids: {
        row: number;
        col: number;
    }[];
};

type RogueTheme = {
    name: string;
    stageDict: { [key: string]: RogueStage };
    toughStageDict: { [key: string]: RogueStage };
    relicDict: { [key: string]: RogueRelic };
    variationDict: { [key: string]: RogueVariation };
};

type RogueRelic = {
    id: string;
    name: string;
    description: string;
    usage: string;
    obtainApproach: string;
    iconId: string;
    type: string;
    subType: string;
    rarity: string;
    value: number;
    sortId: number;
    canSacrifice: boolean;
    unlockCondDesc: string;
};

type RogueStage = {
    excel: RogueStageInfo;
    levels: StageData;
};

type RogueVariation = {
    id: string;
    type: string;
    outerName: string;
    innerName: string;
    functionDesc: string;
    desc: string;
    iconId: string;
    sound: string;
};

type RogueStageInfo = {
    id: string;
    linkedStageId: string;
    levelId: string;
    code: string;
    name: string;
    loadingPicId: string;
    description: string;
    eliteDesc: string;
    isBoss: number;
    isElite: number;
    difficulty: string;
    capsulePool: string;
    capsuleProb: number;
    vutresProb: number[];
    boxProb: number[];
};

type Skill = {
    skillId: string;
    iconId: string;
    hidden: boolean;
    levels: {
        name: string;
        rangeId: string;
        description: string;
        skillType: number;
        durationType: number;
        spData: {
            spType: number;
            levelUpCost: null;
            maxChargeTime: number;
            spCost: number;
            initSp: number;
            increment: number;
        };
        prefabId: string;
        duration: number;
        blackboard: Blackboard[];
    }[];
};

type Skin = {
    skinId: string;
    charId: string;
    tokenSkinMap: {
        tokenId: string;
        tokenSkinId: string;
    }[];
    illustId: string;
    dynIllustId: string;
    avatarId: string;
    portraitId: string;
    dynPortraitId: string;
    dynEntranceId: string;
    buildingId: string;
    battleSkin: {
        overwritePrefab: boolean;
        skinOrPrefabId: string;
    };
    isBuySkin: boolean;
    tmplId: string;
    voiceId: string;
    voiceType: string;
    displaySkin: {
        skinName: string;
        colorList: [string, string, string, string, string];
        titleList: [string, string];
        modelName: string;
        drawerName: string;
        skinGroupId: string;
        skinGroupName: string;
        skinGroupSortIndex: number;
        content: string;
        dialog: string;
        usage: string;
        description: string;
        obtainApproach: string;
        sortId: number;
        displayTagId: string;
        getTime: number;
        onYear: number;
        onPeriod: number;
    };
};

type Stage = {
    excel: StageInfo;
    levels: StageData;
};

type StageInfo = {
    stageType: string;
    difficulty: string;
    performanceStageFlag: string;
    diffGroup: string;
    unlockCondition: {
        stageId: string;
        completeState: number;
    }[];
    stageId: string;
    levelId: string;
    zoneId: string;
    code: string;
    name: string;
    description: string;
    hardStagedId: string;
    dangerLevel: string;
    dangerPoint: number;
    loadingPicId: string;
    canPractice: boolean;
    canBattleReplay: boolean;
    apCost: number;
    apFailReturn: number;
    etItemId: string;
    etCost: number;
    etFailReturn: number;
    etButtonStyle: string;
    apProtectTimes: number;
    diamondOnceDrop: number;
    practiceTicketCost: number;
    dailyStageDifficulty: number;
    expGain: number;
    goldGain: number;
    loseExpGain: number;
    loseGoldGain: number;
    passFavor: number;
    completeFavor: number;
    slProgress: number;
    displayMainItem: string;
    hilightMark: boolean;
    bossMark: boolean;
    isPredefined: boolean;
    isHardPredefined: boolean;
    isSkillSelectablePredefined: boolean;
    isStoryOnly: boolean;
    appearanceStyle: number;
    stageDropInfo: {
        firstPassRewards: null;
        firstCompleteRewards: null;
        passRewards: null;
        completeRewards: null;
        displayRewards: {
            type: string;
            id: string;
            dropType: number;
        }[];
        displayDetailRewards: {
            occPercent: number;
            type: string;
            id: string;
            dropType: number;
        }[];
    };
    startButtonOverrideId: string;
    isStagePatch: boolean;
    mainStageId: string;
};

type StageData = {
    options: {
        characterLimit: number;
        maxLifePoint: number;
        initialCost: number;
        maxCost: number;
        costIncreaseTime: number;
        moveMultiplier: number;
        steeringEnabled: boolean;
        isTrainingLevel: boolean;
        isHardTrainingLevel: boolean;
        functionDisableMask: number;
    };
    levelId: string;
    mapId: string;
    bgmEvent: string;
    environmentSe: string;
    mapData: {
        map: number[][];
        tiles: {
            tileKey: string;
            heightType: number;
            buildableType: number;
            passableMask: number;
            playerSideMask: number;
            blackboard: Blackboard;
            effects: StageEffect[];
        }[];
        blockEdges: null;
        tags: string[];
        effects: StageEffect[];
        layerRects: string[];
        width: number;
        height: number;
    };
    tilesDisallowToLocate: any[];
    runes: {
        difficultyMask: number;
        key: string;
        professionMask: number;
        buildableMask: number;
        blackboard: Blackboard[];
    }[];
    globalBuffs: {
        prefabKey: string;
        blackboard: Blackboard[];
        overrideCameraEffect: null;
        passProfessionMaskFlag: boolean;
        professionMask: number;
    }[];
    routes: {
        motionMode: number;
        startPosition: {
            row: number;
            col: number;
        };
        endPosition: {
            row: number;
            col: number;
        };
        spawnRandomRange: {
            x: number;
            y: number;
        };
        spawnOffset: {
            x: number;
            y: number;
        };
        checkpoints: {
            type: number;
            time: number;
            position: {
                row: number;
                col: number;
            };
            reachOffset: {
                x: number;
                y: number;
            };
            randomizeReachOffset: boolean;
            reachDistance: number;
        }[];
        allowDiagonalMove: boolean;
        visitEveryTileCenter: boolean;
        visitEveryNodeCenter: boolean;
        visitEveryCheckPoint: boolean;
    }[];
    extraRoutes: any[];
    enemies: any[];
    enemyDbRefs: {
        useDb: boolean;
        id: string;
        level: number;
        overwrittenData: {
            name: {
                m_defined: boolean;
                m_value: number;
            };
            description: {
                m_defined: boolean;
                m_value: number;
            };
            prefabKey: {
                m_defined: boolean;
                m_value: number;
            };
            attributes: EnemyAttributes;
            lifePointReduce: {
                m_defined: boolean;
                m_value: number;
            };
            rangeRadius: {
                m_defined: boolean;
                m_value: number;
            };
            talentBlackboard: Blackboard[];
            skills: EnemySkills[];
            spData: EnemySpData;
        };
    }[];
    waves: {
        preDelay: number;
        postDelay: number;
        maxTimeWaitingForNextWave: number;
        fragments: {
            preDelay: number;
            actions: {
                actionType: number;
                managedByScheduler: boolean;
                key: string;
                count: number;
                preDelay: number;
                interval: number;
                routeIndex: number;
                blockFragment: boolean;
                autoPreviewRoute: boolean;
                isUnharmfulAndAlwaysCountAsKilled: boolean;
                hiddenGroup: string
                randomSpawnGroupKey: string;
                weight: number;
                dontBlockWave: boolean;
            }[];
            name: string;
        }[];
    }[];
    branches: {
        frosts: {
            phases: {
                preDelay: number;
                actions: {
                    actionType: number;
                    managedByScheduler: boolean;
                    key: string;
                    count: number;
                    preDelay: number;
                    interval: number;
                    routeIndex: number;
                    blockFragment: boolean;
                    autoPreviewRoute: boolean;
                    isUnharmfulAndAlwaysCountAsKilled: boolean;
                    hiddenGroup: string;
                    randomSpawnGroupKey: string;
                    weight: number;
                    weightValue: number;
                }[];
            }[];
        };
    };
    predefines: StageDefines;
    hardPredefines: StageDefines;
    excludeCharIdList: null;
    randomSeed: number;
    operaConfig: string;
};

type StageEffect = {
    key: string;
    offset: {
        x: number;
        y: number;
        z: number;
    },
    direction: number;
};

type StageDefines = {
    characterInsts: any[];
    tokenInsts: {
        position: {
            row: number;
            col: number;
        };
        direction: number;
        hidden: boolean;
        alias: string;
        uniEquipIds: {
            key: string;
            level: number;
        }[];
        inst: {
            characterKey: string;
            level: number;
            phase: number;
            favorPoint: number;
            potentialRank: number;
        }
        ;
        skillIndex: number;
        mainSkillLvl: number;
        skinId: string;
        tmplId: string;
        overrideSkillBlackboard: Blackboard[];
    }[];
    characterCards: any[];
    tokenCards: any[];
};