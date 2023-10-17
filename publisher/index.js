require('dotenv').config({ path: `${__dirname}/.env` });
const dayjs = require('dayjs');

const { getTimeRange } = require('../common/utils/time');
const { redis } = require('../common/dbs/redis');
const { findScheduledPushes, updatePushes } = require('./repositories/scheduled-pushes.repository');
const { preparePushData } = require('./services/push-data.service');
const { REDIS_CHANNEL } = require('../constants');

const logger = console;

const pushTypeConditions = {
  welocome: (userData) => userData.isSubscribed === 0,
};

const checkPushConditions = ({ systemName, data }) => {
  if (Object.keys(pushTypeConditions).includes(systemName)) {
    return pushTypeConditions[systemName](data);
  }

  return true;
};

(async () => {
  logger.time('pushes-publisher');
  try {
    const { from, to } = getTimeRange({
      currentTime: dayjs().unix(),
      minutesInterval: 5,
    });

    const scheduledPushesQuery = findScheduledPushes({
      from,
      to,
    });

    let pushesToPublish = [];
    const processedPushes = [];

    for await (const push of scheduledPushesQuery.stream()) {
      const { pushId, userId, locale, tokens, systemName, userCreatedAtUnix, ...userData } = push;

      const isContidionFulfilled = checkPushConditions({ systemName, data: userData });

      processedPushes.push({ id: pushId, isContidionFulfilled });

      if (!isContidionFulfilled) {
        continue;
      }

      const pushData = preparePushData({
        locale,
        systemName,
        userCreatedAtUnix,
        userId,
      });

      const pushes = tokens
        .split(',')
        .filter((el) => el)
        .map((pushToken) => ({
          pushToken,
          ...pushData,
        }));

      pushesToPublish.push(...pushes);

      if (pushesToPublish.length >= 500) {
        await redis.publish(REDIS_CHANNEL, JSON.stringify(pushesToPublish));
        pushesToPublish = [];
      }
    }

    if (pushesToPublish.length) {
      await redis.publish(REDIS_CHANNEL, JSON.stringify(pushesToPublish));
    }

    logger.log(`Processed pushes count: ${processedPushes.length}`);

    while (processedPushes.length) {
      const pushes = processedPushes.splice(0, 500);

      await updatePushes(
        pushes.map(({ id }) => id),
        { isProcessed: true },
      );
    }
  } catch (e) {
    logger.log(`Error: ${e.message}`);
  }
  logger.timeEnd('pushes-publisher');

  process.exit(0);
})();
