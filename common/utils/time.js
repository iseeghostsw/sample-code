const dayjs = require('dayjs');

exports.getTimeRange = ({ currentTime, minutesInterval }) => {
  const from = dayjs.unix(currentTime).set('s', 0).set('ms', 0).unix();
  const to = dayjs
    .unix(from)
    .add(minutesInterval - 1, 'm')
    .add(59, 's')
    .unix();

  return { from, to };
};
