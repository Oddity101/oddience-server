module.exports = () => {
  var curr = new Date(); // get current date
  var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
  var last = first + 6; // last day is the first day + 6

  return [
    new Date(curr.setDate(last)).setHours(17, 0, 0),
    new Date(curr.setDate(first)).setHours(17, 0, 0),
  ];
};
