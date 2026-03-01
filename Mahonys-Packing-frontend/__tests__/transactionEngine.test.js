
import {
  createIncomingTransactions,
  createOutgoingTransactions,
  createAdjustmentTransactions,
  createReversalTransactions,
  genTransactionId
} from "../src/utils/transactionEngine";

// Mock data
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

describe("Transaction Engine", () => {
  // Removed global setup

  describe("Incoming Tickets", () => {
    test("should create 3 transactions (Deposit, Shrink Out, Shrink In)", () => {
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

      const transactions = createIncomingTransactions(ticket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);

      expect(transactions).toHaveLength(3);

      // 1. Deposit (Net 100)
      const deposit = transactions.find(t => t.transactionType === "deposit");
      expect(deposit).toBeDefined();
      expect(deposit.quantity).toBe(100);
      expect(deposit.accountId).toBe(1);

      // 2. Shrink Deduction (-10%)
      const shrinkDed = transactions.find(t => t.transactionType === "shrinkage" && t.quantity < 0);
      expect(shrinkDed).toBeDefined();
      expect(shrinkDed.quantity).toBe(-10);
      expect(shrinkDed.accountId).toBe(1);

      // 3. Shrink Addition (+10%)
      const shrinkAdd = transactions.find(t => t.transactionType === "shrinkage" && t.quantity > 0);
      expect(shrinkAdd).toBeDefined();
      expect(shrinkAdd.quantity).toBe(10);
      expect(shrinkAdd.accountId).toBe(99);
    });

    test("should return empty if ticket is not completed", () => {
      const ticket = {
        id: 2,
        type: "in",
        status: "active", // Not completed
        grossWeights: [100],
        tareWeights: [0]
      };
      const transactions = createIncomingTransactions(ticket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);
      expect(transactions).toHaveLength(0);
    });
  });

  describe("Outgoing Tickets", () => {
    test("should create 1 transaction (Withdrawal)", () => {
       const ticket = {
        id: 3,
        type: "out",
        status: "completed",
        grossWeights: [60],
        tareWeights: [10],
        date: "2023-01-02",
        ticketReference: "TKT-002",
        loadingLocation: 5,
        site: 1
      };

      const transactions = createOutgoingTransactions(ticket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);
      
      expect(transactions).toHaveLength(1);
      const withdrawal = transactions[0];
      expect(withdrawal.transactionType).toBe("withdrawal");
      expect(withdrawal.quantity).toBe(-50); // Net 50, so -50
      expect(withdrawal.accountId).toBe(1);
    });
  });

  describe("Adjustments", () => {
    test("should mark old transactions as adjusted and create new ones", () => {
       const oldTicket = {
        id: 1,
        type: "in",
        status: "completed",
        grossWeights: [110],
        tareWeights: [10], // Net 100
        date: "2023-01-01"
      };

      const newTicket = {
        ...oldTicket,
        grossWeights: [120] // Net 110
      };

      // Create initial transactions
      const existingTrans = createIncomingTransactions(oldTicket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);
      
      const { transactionsToUpdate, newTransactions } = createAdjustmentTransactions(
        oldTicket,
        newTicket,
        mockCmo,
        existingTrans,
        mockCommodity,
        mockCustomers,
        mockInternalAccounts
      );

      // Check updates
      expect(transactionsToUpdate).toHaveLength(3);
      transactionsToUpdate.forEach(t => {
        expect(t.status).toBe("adjusted");
      });

      // Check new transactions
      // Check new transactions (3 Negations + 3 Replacements = 6)
      expect(newTransactions).toHaveLength(6);

      // Verify New Deposit (+110)
      const newDeposit = newTransactions.find(t => t.transactionType === "deposit" && t.quantity > 0);
      expect(newDeposit.quantity).toBe(110);
      expect(newDeposit.notes).toContain("ADJUSTMENT");

      // Verify Negation of Old Deposit (-100)
      const oldDepositNegation = newTransactions.find(t => t.transactionType === "deposit" && t.quantity === -100 && t.notes.includes("CORRECTION"));
      expect(oldDepositNegation).toBeDefined();
      expect(oldDepositNegation.status).toBe("active");
    });

  
    test("should handle multiple sequential adjustments correctly (no double negation)", () => {
       const ticket = {
        id: 1,
        type: "in",
        status: "completed",
        grossWeights: [110], // Net 100
        tareWeights: [10]
      };
      
      // 1. Initial Creation
      let transactions = createIncomingTransactions(ticket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);
      
      // 2. First Adjustment (100 -> 110)
      const ticketV2 = { ...ticket, grossWeights: [120] }; // Net 110
      const adj1 = createAdjustmentTransactions(ticket, ticketV2, mockCmo, transactions, mockCommodity, mockCustomers, mockInternalAccounts);
      
      // Apply updates to state (simulate AppContext)
      // Mark old as adjusted
      transactions = transactions.map(t => {
        const update = adj1.transactionsToUpdate.find(u => u.id === t.id);
        return update || t;
      });
      // Add new
      transactions.push(...adj1.newTransactions);

      // Verify intermediate state
      // Should have: T1(100, Adj), T2(-100, Active, Corr), T3(110, Active)
      // Net should be 110
      const sum1 = transactions.reduce((sum, t) => sum + t.quantity, 0);
      expect(sum1).toBe(110);

      // 3. Second Adjustment (110 -> 120)
      const ticketV3 = { ...ticket, grossWeights: [130] }; // Net 120
      const adj2 = createAdjustmentTransactions(ticketV2, ticketV3, mockCmo, transactions, mockCommodity, mockCustomers, mockInternalAccounts);
      
      // Apply updates
      transactions = transactions.map(t => {
        const update = adj2.transactionsToUpdate.find(u => u.id === t.id);
        return update || t;
      });
      transactions.push(...adj2.newTransactions);

      // 4. Verify Final State
      // Should have:
      // T1(100, Adj)
      // T2(-100, Active, Corr) <- Should NOT be negated
      // T3(110, Adj) <- Should be negated
      // T4(-110, Active, Corr) <- Negation of T3
      // T5(120, Active) <- New
      
      // Net should be 120
      const sum2 = transactions.reduce((sum, t) => sum + t.quantity, 0);
      expect(sum2).toBe(120);
    });
  });
  
  describe("Reversals", () => {
    test("should mark transactions as reversed and create negation entries", () => {
       const ticket = {
        id: 1,
        type: "in",
        status: "completed",
        grossWeights: [110],
        tareWeights: [10]
      };
      
      const existingTrans = createIncomingTransactions(ticket, mockCmo, mockCommodity, mockCustomers, mockInternalAccounts);
      
      const { reversalTransactions, transactionsToUpdate } = createReversalTransactions(
        ticket,
        mockCmo,
        existingTrans
      );

      expect(transactionsToUpdate).toHaveLength(3);
      transactionsToUpdate.forEach(t => expect(t.status).toBe("reversed"));

      expect(reversalTransactions).toHaveLength(3);
       // Check that deposit (100) is reversed with (-100)
       const depositRev = reversalTransactions.find(t => t.notes.includes("deposit"));
       // The original was deposit (100), so reversal should be -100.
       // Note: createReversalTransactions copies the original and flips the sign.
       // Let's verify valid logic:
       // Original: quantity = 100. Reversal: quantity = -100.
       
       // actually check for one example
       const originalDeposit = existingTrans.find(t => t.transactionType === "deposit");
       const reversalDeposit = reversalTransactions.find(t => t.adjustmentOf === originalDeposit.id);
       
       expect(reversalDeposit.quantity).toBe(-originalDeposit.quantity);
       expect(reversalDeposit.status).toBe("active");
    });
  });

});
