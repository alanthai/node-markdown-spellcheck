import program from 'commander';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import context from './context';
import markdownSpellcheck from "./index";
import 'colors';
import generateSummary from './summary-generator';
import filterAcronyms from './acronym-filter';

const packageConfig = fs.readFileSync(path.join(__dirname, '../package.json'));
const buildVersion = JSON.parse(packageConfig).version;

program
  .version(buildVersion)
  .option('-s, --summary', 'Outputs a summary report which details the unique spelling errors found.')
  .option('-a, --ignore-acronyms', 'Ignores acronyms.')
  .usage("[options] source-file source-file");

program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  process.exit();
} else {
  const inputPatterns = program.args;
  for(let i = 0; i < inputPatterns.length; i++) {
    glob(inputPatterns[i], (err, files) => {
      for(let j = 0; j < files.length; j++) {
        try {
          const file = files[j];
          console.log("Spelling - " + file.bold);
          var spellingInfo = markdownSpellcheck.spellFile(file);

          if (program.ignoreAcronyms) {
            spellingInfo.errors = filterAcronyms(spellingInfo.errors);
          }

          if (program.summary) {
              const summary = generateSummary(spellingInfo.errors);
              console.log(summary);
          } else {
              for(let k = 0; k < spellingInfo.errors.length; k++) {
                const error = spellingInfo.errors[k];

                var displayBlock = context.getBlock(spellingInfo.src, error.index, error.word.length);
                console.log(displayBlock.info);
              }
          }

        }
        catch(e) {
          console.log("Error in " + files[j])
          console.error(e);
          console.error(e.stack);
        }
      }
    });
  }
}