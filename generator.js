const fs = require('fs');
const toPascalCase = require('to-pascal-case');
const Handlebars = require('handlebars');
const util = require('util');
const path = require('path');

Handlebars.registerHelper('toLowerCase', (str) => 
    str.toLowerCase()
);

Handlebars.registerHelper('toUpperCase', (str) =>
    str.toUpperCase()
);

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const questions = require('./questions')

const getTplNameForType = (type, isStateless) => {
    switch(true) {
        case (type === 'component' && isStateless):
            return 'component-stateless';
        break;
        case (type === 'page' || type === 'container'):
        case (type === 'component' && !isStateless):
            return 'container';
        break;
        default:
            return 'component-stateless';
        break;
    }
}

let allAnswers = {};
const generator = async () => {
    const fileTypeAnwser = await questions.fileTypeQuestion();
    allAnswers = {...allAnswers, ...fileTypeAnwser};
    const filenameAnwser = await questions.filenameQuestion(allAnswers);
    allAnswers = {...allAnswers, ...filenameAnwser};
    const componentSpecifityAnswer = await questions.componentSpecifityQuestion(allAnswers);
    allAnswers = {...allAnswers, ...componentSpecifityAnswer};

    if (allAnswers.needs_redux) {
        const reduxComplexityAnswer = await questions.reduxComplexityQuestion(allAnswers);
        allAnswers = {...allAnswers, ...reduxComplexityAnswer};
    }

    const generationPlaceAnswer = await questions.generationPlaceQuestion(allAnswers);
    allAnswers = {...allAnswers, ...generationPlaceAnswer};

    const fileFolder = `./${allAnswers.name}`;
    if (!fs.existsSync(fileFolder)){
        fs.mkdirSync(fileFolder);
    } else {
        throw new Error(`The folder ${allAnswers.name} already exists`)
    }
    
    const templateType = getTplNameForType(allAnswers.type, allAnswers.is_stateless)
    const tpls = [
        {
            path: `./templates/${templateType}/index.hbs`,
            dist: `${fileFolder}`,
            distExt: 'jsx'
        }, {
            path: `./templates/shared/index.test.hbs`,
            dist: `${fileFolder}`,
            distExt: 'js'
        }, {
            path: `./templates/shared/style.hbs`,
            dist: `${fileFolder}`,
            distExt: 'pcss' // dynamise ?
        }
    ];

    if (allAnswers.needs_redux) {
        if (allAnswers.needs_a_big_reducer) {
            const bigReducerTplFiles = [
                'actions', 'constants', 
                'reducer', 'index'
            ].map(filename => ({
                path: `./templates/container/modules/${filename}.hbs`,
                distExt: 'js',
                dist: `${fileFolder}/modules`,
                distName: filename
            }))
            tpls.push(...bigReducerTplFiles)
        } else {
            tpls.push({
                path: './templates/container/reducer.hbs',
                distExt: 'js',
                dist: `${fileFolder}/modules`,
                distName: 'index'
            })
        }
        fs.mkdirSync(`${fileFolder}/modules`);
    }

    const promises = []
    const pascalCaseName = toPascalCase(allAnswers.name);
    tpls.forEach(async (tpl) => {
        const data = await readFile(tpl.path, 'utf8');
        const template = Handlebars.compile(data)
        const result = template({
            ...allAnswers,
            name: pascalCaseName,
        });
        const distName = (tpl.distName) ? tpl.distName : path.basename(tpl.path, '.hbs')

        promises.push(
            writeFile(
                `./${tpl.dist}/${distName}.${tpl.distExt}`, 
                result, 
                'utf8'
            )
        );
    })

    Promise.all(promises).then((values) => {
        console.log(`
            <${pascalCaseName} /> component ✔
            <${pascalCaseName} /> component's unit test file ✔ 
            <${pascalCaseName} /> component's style file ✔
        `)
        console.log('Ready to develop!')
    });
}
generator();