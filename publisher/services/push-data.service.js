const translations = require('../../translations.json');
const { RETENTION_DEEPLINKS } = require('../../constants');

export const preparePushData = ({ locale, systemName, userCreatedAtUnix, userId }) => {
  return {
    title: translations[locale][`${systemName}_title`],
    body: translations[locale][`${systemName}_body`],
    systemName,
    pageToOpen: RETENTION_DEEPLINKS[systemName],
    userId,
    userCreatedAtUnix,
  };
};
