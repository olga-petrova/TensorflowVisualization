/*
Pre-process data:
import data from './data_preprocessing/Data.js';
import preprocessor from './data_preprocessing/DataPreprocessor.js';

var processor = new preprocessor(),
data = processor.collectData(data);
*/
let moment = require('moment');
let DateDiff = require('date-diff');
let dateFormat = 'DD MMM YYYY - HH:mm';


export default class Preprocessor {
    getHostCountry(year) {
        let hosts = {
            "1930":	 "Uruguay",
            "1934":	 "Italy",
            "1938":	 "France",
            "1950":	 "Brazil",
            "1954":	 "Switzerland",
            "1958":	 "Sweden",
            "1962":	 "Chile",
            "1966":	 "England",
            "1970":	 "Mexico",
            "1974":	 "Germany",
            "1978":	 "Argentina",
            "1982":	 "Spain",
            "1986":	 "Mexico",
            "1990":	 "Italy",
            "1994":	 "United States",
            "1998":	 "France",
            "2002":	 ["Japan", "South Korea"],
            "2006":	 "Germany",
            "2010":	 "South Africa",
            "2014":	 "Brazil",
            "2018":	 "Russia"
        };
        return hosts[year];
    }


    getMatchResult(item) {
        return (item.home_team_goals > item.away_team_goals) ? 1 : 
            (item.home_team_goals < item.away_team_goals) ? -1 :
            (item.win_conditions.trim() == "") ? 0 : 
            (item.win_conditions.substring(item.home_team_name) > -1) ? 1 : -1;
    }

    getStageIndex(stage) {
        if (stage.toLowerCase().indexOf('16') > -1) return 1;
        if (stage.toLowerCase().indexOf('quarter') > -1) return 2;
        if (stage.toLowerCase().indexOf('third') > -1) return 3;
        if (stage.toLowerCase().indexOf('semi') > -1) return 4;
        if (stage.toLowerCase().indexOf('final') > -1) return 5;
        return 0;
    }

    flattenData(data) {
        var flatData = [];
        for (let index in data) {
            
            var item = data[index],
                result = this.getMatchResult(item),
                date = (item.year == 2018) ? new Date(item.datetime) : moment(item.datetime, dateFormat)._d;
            
            //add home team record
            flatData.push({
                "team_name": item.home_team_name,
                "competitor_name": item.away_team_name,
                "score": result,
                "team_goals": item.home_team_goals,
                "competitor_goals": item.away_team_goals,
                "year": item.year,
                "datetime": date, //30 Jun 2014 - 17:00
                "stage": item.stage
            });
    
            //add away team record
            flatData.push({
                "team_name": item.away_team_name,
                "competitor_name": item.home_team_name,
                "score": 0 - result,
                "team_goals": item.away_team_goals,
                "competitor_goals": item.home_team_goals,
                "year": item.year,
                "datetime": date,
                "stage": item.stage
            }); 
        }
        return flatData;
    }

    isParentCountry(parent, child) {
        var parentCounties = {
            "Czechoslovakia": ["Czech Republic", "Slovakia"],
            "Yugoslavia": ["Croatia", "Slovenia", "Serbia and Montenegro", "Serbia", "Bosnia and Herzegovina"],
            "Serbia and Montenegro": ["Serbia"],
            "Soviet Union": ["Russia", "Ukraine"]
        };
        return parentCounties[parent] ? parentCounties[parent].indexOf(child) > -1 : false;
    }

    splitData(data, testYears, validateYears) {
        var trainData = [],
            testData = [],
            validateData = [];
        for (let index in data) {
            let item = data[index];
            if (testYears.indexOf(item.year) > -1) {
                testData.push(item);
            } else if (validateYears.indexOf(item.year) > -1) {
                validateData.push(item);
            } 
            trainData.push(item);
        }
        return [trainData, testData, validateData];
    }
    
    async getData() {
        const data_t = await fetch('resources/data/data.json');  
        const jsonData_t = await data_t.json();  
    }

    process(data) {
        let [trainDataOriginal, testDataOriginal, validateDataOriginal] = this.splitData(data, [], [2014]),
            trainData = this.collectData(trainDataOriginal, trainDataOriginal),
            testData = this.collectData(testDataOriginal, trainDataOriginal),
            validateData = this.collectData(validateDataOriginal, trainDataOriginal/*.concat(testDataOriginal)*/),
            [trainDataFeatures, trainDataTarget] = trainData,
            [testDataFeatures, testDataTarget] = testData,
            [validateDataFeatures, validateDataTarget] = validateData;
        
        return [[trainDataFeatures, trainDataTarget], 
            [testDataFeatures, testDataTarget], 
            [validateDataFeatures, validateDataTarget]];
    }


    getInfoForCountries(target, baseData) {
        var country1 = target.home_team_name, 
            country2 = target.away_team_name,
            date = (target.year == 2018) ? new Date(target.datetime) : moment(target.datetime, dateFormat)._d,
            wins_team1 = 0,
            wins_team2 = 0,
            wins_team1_last_12years = 0,
            wins_team2_last_12years = 0,
            wins_team1_minus_wins_team2  = 0,
            wins_team1_against_team2 = 0,
            wins_team1_minus_wins_team2_last_12years = 0,
            wins_team1_against_team2_last_12years = 0,
            wins_team1_against_team2_in_stage = 0,
            year = target.year;
            
        for (let index in baseData) {
            let item = baseData[index];
            
            if (((item.team_name == country1) || (this.isParentCountry(item.team_name, country1)))
                 && (item.datetime < date)) {
                wins_team1 += item.score;
                wins_team1_minus_wins_team2 += item.score;
                if ((new DateDiff(date, item.datetime)).years() < 13) {
                    wins_team1_last_12years += item.score;
                    wins_team1_minus_wins_team2_last_12years += item.score;
                }
            }
            if (((item.team_name == country2) || (this.isParentCountry(item.team_name, country2)))
                 && (item.datetime < date)) {
                wins_team2 += item.score;
                wins_team1_minus_wins_team2 -= item.score;
                if ((new DateDiff(date, item.datetime)).years() < 13) {
                    wins_team2_last_12years += item.score;
                    wins_team1_minus_wins_team2_last_12years -= item.score;
                }
            }
            if (((item.team_name == country1) || (this.isParentCountry(item.team_name, country1)))
                 && ((item.competitor_name == country2) || (this.isParentCountry(item.competitor_name, country2)))
                && (item.datetime < date)) {
                
                wins_team1_against_team2 += item.score;
                if ((new DateDiff(date, item.datetime)).years() < 13) {
                    wins_team1_against_team2_last_12years += item.score;
                }
                if (this.getStageIndex(target.stage) == this.getStageIndex(item.stage)) {
                    wins_team1_against_team2_in_stage += item.score;
                }
            }
            
        }
        
        return {
            year,
            wins_team1,
            wins_team2,
            wins_team1_last_12years,
            wins_team2_last_12years,
            wins_team1_minus_wins_team2,
            wins_team1_against_team2,
            wins_team1_minus_wins_team2_last_12years,
            wins_team1_against_team2_last_12years,
            wins_team1_against_team2_in_stage
        };
    }


    collectData(data, baseData) {
        var flatBaseData = this.flattenData(baseData),
            featureData = [],
            targetData = [];
    
        for (let index in data) {
            var item = data[index],
                info = this.getInfoForCountries(item, flatBaseData),
                matchResult = (this.getMatchResult(item)),
                host = this.getHostCountry(item.year),
                isHomeCountry = ((item.home_team_name == host) || (host.indexOf(item.home_team_name) > -1)) ? 1 : ((item.away_team_name == host) || (host.indexOf(item.away_team_name) > -1)) ? -1 : 0,
                stage = this.getStageIndex(item.stage);// == 1) ? 1 : 0;
            info.isHomeCountry = isHomeCountry;
            info.stage = stage;
            info.attendance = item.attendance;
            info.matchResult = matchResult;
            featureData.push(info);
            
        }
        return featureData;
    }

}


