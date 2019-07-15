const dictionary = {
  kalmyk: {},
  russian: {},
};
const fs = require('fs');

const Router = require('koa-router');
const Koa = require('koa');
const app = new Koa();
const router = new Router();
const koaBody = require('koa-body');

const assert = require('assert');
const dictionaryUrl = '/words/';

const schemaWord = {
  kalmyk: String,
  russian: String,
};

const dictionaryFile = 'dictionary.json'

const flushDb = () => {
  fs.writeFileSync(dictionaryFile, JSON.stringify(dictionary), {encoding: 'utf8'})
}

const readDb = () => {
  try {
    JSON.parse(fs.readFileSync(dictionaryFile, {encoding: 'utf8'}));
  } catch(e) {
    return {}
  }
}

const defaultStateDictonary = {


};


const addLink = ({langFrom, wordFrom, langTo, wordTo}) => {
  if (!dictionary[langFrom][wordFrom]) {
    dictionary[langFrom][wordFrom] = [{lang: langTo, word: wordTo}]
  } else {
    const el = dictionary[langFrom][wordFrom];
    const isDuplicate = el.filter(
      ({word, lang}) => word === wordTo&& lang === langTo
    ).length > 0
    if (!isDuplicate) dictionary[langFrom][wordFrom].push({lang: langTo, word: wordTo});
  }
}

const addWord = async ({langFrom, wordFrom, langTo, wordTo}) => {

  if (!dictionary[langFrom]) {
    dictionary[langFrom] = {};
  }
  if (!dictionary[langTo]) {
    dictionary[langTo] = {};
  }
  addLink({langFrom, langTo, wordFrom, wordTo});
  addLink({
    langFrom: langTo,
    langTo: langFrom,
    wordFrom: wordTo,
    wordTo: wordFrom
  });
  flushDb();
}

const alphabets = [
  'а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'э'
];

const getSingleWord = async ({word, langFrom, langTo}) => {
  if (!dictionary[langFrom])
    return [];
  if (!dictionary[langFrom][word])
    return [];
  const words = dictionary[langFrom][word];
  return words.filter(({lang}) => lang === langTo);
}

const replaceChar = (word, i, char) => {
const arrWord = word.split('')
  arrWord[i] = char;
  return arrWord.join('');
}

const generateWordForm = (word, alphabet) => {
  const res = [];
  for (let i = 0; i < word.length; i++) {
    for (const char of alphabet){
      res.push(replaceChar(word, i, char));
    }
  }
  return res;
}

const getWord = async ({word, langFrom, langTo}) => {
  const specificResult = await getSingleWord({word, langTo, langFrom})
  if (specificResult.length > 0) {
    return specificResult
  }
  const wordForms = [word].concat(generateWordForm(word, alphabets))
  const possibleWords = await Promise.all(wordForms
    .map(
      x => getSingleWord ({word: x, langFrom, langTo})
    )
  )
  const allWords = possibleWords.reduce((r, x) => r.concat(x), [])
  const wordSet = new Set(
    allWords.map(x => JSON.stringify(x))
  )
  return Array.from(wordSet).map(x => JSON.parse(x))
}

const errorHandlingMiddleware = async (ctx, next) => {
  try{
    await next();
  } catch ({message}) {
    errorMessage(ctx, {message});
  }
}

router.post(dictionaryUrl, koaBody(), errorHandlingMiddleware, async ctx => {
  const {kalmyk, russian} = ctx.request.body;

  assert.ok(kalmyk, 'should have kalmyk');
  assert.ok(russian, 'should have russian');

  kalmyk

  assert.ok(typeof kalmyk === 'string', 'kalmyk should be string');
  assert.ok(typeof russian === 'string', 'russian should be string');

  await addWord({
    langFrom: 'kalmyk',
    langTo: 'russian',
    wordFrom: normalizeWord(kalmyk),
    wordTo: normalizeWord(russian)
  });
  okMessage(ctx);
});



const errorMessage = (ctx, {message, status = 422}) => {
  ctx.status;
  ctx.body = {code: 'error', message}
}

const okMessage =(ctx, data) => {
  ctx.body = {code: 'ok', data};
}

const availableLanguages = ['russian', 'kalmyk'];

router.get(dictionaryUrl, errorHandlingMiddleware, async ctx => {
  const {word, langFrom, langTo} = ctx.query;

  assert.ok(word, 'should be word');
  assert.ok(typeof word === 'string', 'word should be string');

  const normalizeWord = normalizeWord(word);

  assert.ok(availableLanguages.includes(langFrom), 'lang FROM should be available language');
  assert.ok(availableLanguages.includes(langTo), 'lang TO should be available language');
  assert.ok(langTo != langFrom, 'lang from should be be not equal lang to');
  const result = await getWord({word, langFrom, langTo});

  if(!result){
    return void errorMessage(ctx, {message: 'word not found', status: 404});
  }
  okMessage(ctx, result);
});

app.use(router.routes());
app.listen(3000);

process.on('SIGINT', () => {
  process.exit(0);
});
