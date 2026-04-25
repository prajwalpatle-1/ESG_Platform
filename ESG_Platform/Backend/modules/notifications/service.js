let notifications = [];

function notify(message) {
  console.log("ALERT:", message);
  const notification = {
    id: Date.now(),
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  notifications.push(notification);
  return notification;
}

function getNotifications() {
  return notifications;
}

function markAsRead(id) {
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
  }
  return notification;
}

function clearNotifications() {
  notifications = [];
}

module.exports = {
  notify,
  getNotifications,
  markAsRead,
  clearNotifications
};