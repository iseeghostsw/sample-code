const { db } = require('../../common/dbs/db');

export const findScheduledNotificatinos = async ({ from, to }) => {
  try {
    const query = db('scheduled_pushes as sn')
      .leftJoin('users as u', 'u.id', 'sn.user_id')
      .leftJoin('user_config as uc', 'uc.user_id', 'u.id')
      .leftJoin('user_devices as ud', 'ud.user_id', 'u.id')
      .whereBetween('sn.created_at_unix', [from, to])
      .andWhere('ud.pushesEnabled', true)
      .andWhere('sn.isSent', false)
      .select([
        'sn.id as pushId',
        'sn.userId',
        'sn.systemName',
        'u.locale',
        'u.isSubscribed',
        'group_concat(distinct ud.pushToken) as pushTokens',
      ]);

    return query;
  } catch (e) {
    console.log(`Error in findScheduledNotificatinos: ${e.message}`);
  }
};

export const updatePushes = async (ids, updateData) => {
  try {
    await db('scheduled_pushes').whereIn('id', ids).update(updateData);
  } catch (e) {
    console.log(`Error in updatePushes: ${e.message}`);
  }
};
