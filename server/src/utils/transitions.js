const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed'];
const FLOW = { Pending: ['Preparing'], Preparing: ['Ready'], Ready: ['Completed'], Completed: [] };
const canTransition = (from, to) => (FLOW[from] || []).includes(to);
module.exports = { STATUSES, FLOW, canTransition };
