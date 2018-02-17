const fs = require('fs');
const inquirer = require('inquirer');
const toPascalCase = require('to-pascal-case');
const Handlebars = require('handlebars');
const util = require('util');

const readFile = util.promisify(fs.readFile);

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

const firstQuestion = () => {
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
                preselected: 'y'
            })
        break;
        case 'page':
        case 'container':
            question = questionConfirmFiller({
                message: 'Is a staless component?',
                name: 'is_stateless',
                preselected: 'y'
            })
        break;
    }
    return inquirer.prompt([question])
}

let allAnswers = {};
const generator = async () => {
    const firstAnswer = await firstQuestion();
    allAnswers = {...allAnswers, ...firstAnswer};
    const secondAnwser = await secondQuestion(allAnswers);
    allAnswers = {...allAnswers, ...secondAnwser};
    const thirdAnwser = await thirdQuestion(allAnswers);
    allAnswers = {...allAnswers, ...thirdAnwser};


    const foo = await readFile('./templates/component-stateless.hbs')
    console.log('componentFile', foo.data)

    // fs.readFile('./templates/component-stateless.hbs', 'utf8', function (err, data) {
    //     if (err) {
    //         return console.log(err);
    //     }

    //     const fileFolder = `./${allAnswers.name}`;
    //     if (!fs.existsSync(fileFolder)){
    //         fs.mkdirSync(fileFolder);
    //     }
 
    //     const template = Handlebars.compile(data)
    //     const result = template({
    //         ...allAnswers,
    //         name: toPascalCase(allAnswers.name),
    //     });

    //     fs.writeFile(`${fileFolder}/index.js`, result, 'utf8', function (err) {
    //         if (err) return console.log(err);
    //     });
    // });
}
generator();