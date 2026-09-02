import { strongBigramWeight, mediumUnigramWeight, weakUnigramWeight } from './thresholds.js';

export const INTENTS = {
  BOOK: {
    unigrams: [
      { token: 'записаться', weight: mediumUnigramWeight },
      { token: 'запишусь', weight: mediumUnigramWeight },
      { token: 'запись', weight: weakUnigramWeight },
    ],
    bigrams: [
      { token: 'хочу записаться', weight: strongBigramWeight },
      { token: 'записаться к', weight: strongBigramWeight },
      { token: 'записаться на', weight: strongBigramWeight },
      { token: 'за писаться', weight: strongBigramWeight },
      { token: 'запишите меня', weight: strongBigramWeight },
      { token: 'запиши меня', weight: strongBigramWeight },
      { token: 'запишите на', weight: strongBigramWeight },
      { token: 'запиши на', weight: strongBigramWeight },
    ],
    referenceScore: 5.0,
  },
  CANCEL: {
    unigrams: [
      { token: 'отменить', weight: mediumUnigramWeight },
      { token: 'отменю', weight: mediumUnigramWeight },
      { token: 'аннулировать', weight: mediumUnigramWeight },
      { token: 'запись', weight: weakUnigramWeight },
    ],
    bigrams: [
      { token: 'отменить запись', weight: strongBigramWeight },
    ],
    referenceScore: 5.0,
  },
  RESCHEDULE: {
    unigrams: [
      { token: 'перенести', weight: mediumUnigramWeight },
      { token: 'перенесу', weight: mediumUnigramWeight },
      { token: 'вместо', weight: mediumUnigramWeight },
      { token: 'запись', weight: weakUnigramWeight },
    ],
    bigrams: [
      { token: 'перенести запись', weight: strongBigramWeight },
    ],
    referenceScore: 5.0,
  },
  INFO: {
    unigrams: [
      { token: 'стоит', weight: mediumUnigramWeight },
      { token: 'сколько', weight: mediumUnigramWeight },
      { token: 'цена', weight: mediumUnigramWeight },
      { token: 'стоимость', weight: mediumUnigramWeight },
      { token: 'расценки', weight: mediumUnigramWeight },
      { token: 'прайс', weight: mediumUnigramWeight },
      { token: 'график', weight: mediumUnigramWeight },
      { token: 'часы', weight: mediumUnigramWeight },
      { token: 'адрес', weight: mediumUnigramWeight },
      { token: 'принимает', weight: 1.0 },
    ],
    bigrams: [
      { token: 'сколько стоит', weight: strongBigramWeight },
      { token: 'скажите сколько', weight: strongBigramWeight },
      { token: 'стоит приём', weight: strongBigramWeight },
      { token: 'стоит прием', weight: strongBigramWeight },
      { token: 'часы работы', weight: strongBigramWeight },
    ],
    referenceScore: 5.0,
  },
  OPERATOR: {
    unigrams: [
      { token: 'оператор', weight: mediumUnigramWeight },
      { token: 'человек', weight: mediumUnigramWeight },
      { token: 'человеком', weight: mediumUnigramWeight },
      { token: 'роботом', weight: mediumUnigramWeight },
      { token: 'робот', weight: mediumUnigramWeight },
    ],
    bigrams: [
      { token: 'поговорить с человеком', weight: strongBigramWeight },
      { token: 'с человеком', weight: strongBigramWeight },
      { token: 'живого человека', weight: strongBigramWeight },
      { token: 'с роботом', weight: strongBigramWeight },
      { token: 'не с роботом', weight: strongBigramWeight },
    ],
    referenceScore: 6.0,
  },
  COMPLAINT: {
    unigrams: [
      { token: 'пожаловаться', weight: mediumUnigramWeight },
      { token: 'жалоба', weight: mediumUnigramWeight },
      { token: 'жалуюсь', weight: mediumUnigramWeight },
      { token: 'безобразие', weight: mediumUnigramWeight },
      { token: 'недоволен', weight: mediumUnigramWeight },
      { token: 'претензия', weight: mediumUnigramWeight },
    ],
    bigrams: [
      { token: 'хочу пожаловаться', weight: strongBigramWeight },
    ],
    referenceScore: 5.0,
  },
  UNCLEAR: {
    unigrams: [],
    bigrams: [],
    referenceScore: 1,
  },
};
