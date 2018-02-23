const toPascalCase = require('to-pascal-case');
const inquirer = require('inquirer');
inquirer.registerPrompt('directory', require('inquirer-directory'));

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


// ------------------------ Questions

const fileTypeQuestion = (answer) => {
    const question = questionListFiller({
        name: 'type',
        message: 'What kind of new file you want to create?',
        choices: ['Component', 'Container', 'Page'],
        preselected: 'Component',
    })

    return inquirer.prompt([question])
}

const filenameQuestion = (answer) => {
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

const componentSpecifityQuestion = (answer) => {
    let question = {};
    question.default = 'y'
    switch(answer.type) {
        case 'component':
            question = questionConfirmFiller({
                message: 'Is a stateless component?',
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
    
    return inquirer.prompt([question])
}

const reduxComplexityQuestion = (answer) => {
    let question = {};
    question.default = 'y'
    
    question = questionConfirmFiller({
        message: `Does <${toPascalCase(answer.name)} /> need a big reducer?`,
        name: 'needs_a_big_reducer',
    })
    
    return inquirer.prompt([question])
}


const generationPlaceQuestion = (answer) => {
    const question = {
        type: 'directory',
        name: 'where',
        message: `Where you want to generate <${toPascalCase(answer.name)} />?`,
        basePath: process.cwd()
      };

    return inquirer.prompt([question])
}

const linterQuestion = (answer) => {
    let question = questionConfirmFiller({
        message: 'Do you want to (es)lint your fresh new files?',
        name: 'needs_lint',
    });
    question.default = false;

    return inquirer.prompt([question])
}


module.exports = {
    reduxComplexityQuestion: reduxComplexityQuestion,
    componentSpecifityQuestion: componentSpecifityQuestion,
    fileTypeQuestion: fileTypeQuestion,
    filenameQuestion: filenameQuestion,
    generationPlaceQuestion: generationPlaceQuestion,
    linterQuestion: linterQuestion,
}
