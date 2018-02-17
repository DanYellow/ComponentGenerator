const fs = require('fs');
const inquirer = require('inquirer');
const toPascalCase = require('to-pascal-case');
const Handlebars = require('handlebars');
const util = require('util');
const path = require('path');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const questionListFiller = ({name, choices, message, preselected}) => ({
    type: 'list',
    name,
    message,
    choices,
    default: preselected,
    filter: (val) => {
        return val.toLowerCase();
    }
})


const questionConfirmFiller = ({name, message, preselected = false}) => ({
    type: 'confirm',
    name,
    message,
    default: preselected
})

const fileTypeQuestion = () => {
    const question = questionListFiller({
        name: 'type',
        message: 'What kind of new file you want to create?',
        choices: ['Component', 'Container', 'Page'],
        preselected: 'Component',
    })
    return inquirer.prompt([question])
}

const secondQuestion = (answer) => {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: `What's your ${answer.type}'s name?`,
            validate: function(value) {
              var pass = value.match(
                /^[a-z\-]\S{3,}$/
              );
              if (pass) {
                return true;
              }
        
              return `
                Please enter a valid ${answer.type} name.
                Spaces, numbers, underscore and specials chars are not allowed
                `;
            },
            filter: (val) => {
                return val.toLowerCase();
            }
        }
    ])
}

const thirdQuestion = (answer) => {
    let question = null;
    switch(answer.type) {
        case 'component':
            question = questionConfirmFiller({
                message: 'Is a staless component?',
                name: 'is_stateless',
            })
        break;
        case 'page':
        case 'container':
            question = questionConfirmFiller({
                message: 'Does he need redux?',
                name: 'needs_redux',
            })
        break;
    }
    question.preselected = 'Y'
    return inquirer.prompt([question])
}

const getTplNameForType = (type, isStateless) => {
    switch(true) {
        case (type === 'component' && isStateless):
            return 'component-stateless';
        break;
        case (type === 'component' && !isStateless):
            return 'component';
        break;
        case (type === 'page' || type === 'container'):
            return 'container';
        break;
        default:
            return 'component-stateless';
        break;
    }
}

let allAnswers = {};
const generator = async () => {
    const fileTypeAnwser = await fileTypeQuestion();
    allAnswers = {...allAnswers, ...fileTypeAnwser};
    const secondAnwser = await secondQuestion(allAnswers);
    allAnswers = {...allAnswers, ...secondAnwser};
    const thirdAnwser = await thirdQuestion(allAnswers);
    allAnswers = {...allAnswers, ...thirdAnwser};


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
            distExt: 'jsx'
        }, {
            path: `./templates/shared/index.test.hbs`,
            distExt: 'js'
        }, {
            path: `./templates/shared/style.hbs`,
            distExt: 'pcss' // dynamise ?
        }
    ]
    const promises = []
    const pascalCaseName = toPascalCase(allAnswers.name);
    tpls.forEach(async (tpl) => {
        const data = await readFile(tpl.path, 'utf8');
        const template = Handlebars.compile(data)
        const result = template({
            ...allAnswers,
            name: pascalCaseName,
        });

        promises.push(
            writeFile(
                `${fileFolder}/${path.basename(tpl.path, '.hbs')}.${tpl.distExt}`, 
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
        console.log('Ready to go!')
    });
}
generator();