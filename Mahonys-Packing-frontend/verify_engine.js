
const { 
  createIncomingTransactions, 
  createOutgoingTransactions 
} = require('./src/utils/transactionEngine');

console.log("Loading modules...");

const mockCustomers = [
  { id: 1, name: "Customer A", accountType: "customer" },
  { id: 2, name: "Customer B", accountType: "customer" }
];

const mockInternalAccounts = [
  { id: 99, name: "Shrink Account", shrinkReceivalAccount: true, accountType: "internal" }
];

const mockCommodity = {
  id: 101,
  name: "Wheat",
  shrinkAmount: "10%"
};

const mockCmo = {
  id: 500,
  customerId: 1,
  commodityId: 101
};

const ticket = {
  id: 1,
  type: "in",
  status: "completed",
  grossWeights: [110],
  tareWeights: [10],
  date: "2023-01-01",
  ticketReference: "TKT-001",
  unloadedLocation: 5,
  site: 1
};

console.log("Testing createIncomingTransactions...");
try {
  const transactions = createIncomingTransactions(ticket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);
  console.log("Transactions created:", transactions.length);
  console.log(JSON.stringify(transactions, null, 2));
} catch (error) {
  console.error("Error running createIncomingTransactions:", error);
}
