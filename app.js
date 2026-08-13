/* =========================================================
   POINTS OF BUY & SELL — PHASE 2
   Buy • Sell • Inventory • Profit • Barcode/SKU
   ========================================================= */

const STORAGE_KEY = "points_of_buy_and_sell_phase2";

/* =========================
   DATABASE
========================= */

const defaultDatabase = {
    products: [
        {
            id: 1,
            name: "iPhone 13 128GB",
            sku: "IP13-128",
            barcode: "880000000001",
            category: "Phones",
            cost: 18000,
            price: 21500,
            stock: 4,
            minimumStock: 1
        },
        {
            id: 2,
            name: "Samsung Galaxy A55",
            sku: "SA55",
            barcode: "880000000002",
            category: "Phones",
            cost: 16500,
            price: 19500,
            stock: 7,
            minimumStock: 2
        },
        {
            id: 3,
            name: "Bluetooth Speaker",
            sku: "BTS-01",
            barcode: "880000000003",
            category: "Accessories",
            cost: 850,
            price: 1299,
            stock: 18,
            minimumStock: 5
        },
        {
            id: 4,
            name: "Wireless Earbuds",
            sku: "EAR-01",
            barcode: "880000000004",
            category: "Accessories",
            cost: 450,
            price: 799,
            stock: 3,
            minimumStock: 5
        }
    ],

    sales: [],
    purchases: [],
    customers: [],
    suppliers: [],
    expenses: [],
    stockMovements: [],

    nextId: 100
};

let database =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
    defaultDatabase;

let sellCart = [];

/* =========================
   SAVE DATABASE
========================= */

function saveDatabase() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(database)
    );
}

/* =========================
   MONEY
========================= */

function money(amount) {
    return "₱" + Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   TOAST
========================= */

function showToast(message) {

    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

/* =========================
   CALCULATE TOTALS
========================= */

function getBusinessTotals() {

    const sales = database.sales.reduce(
        (total, sale) => total + sale.total,
        0
    );

    const costOfGoods = database.sales.reduce(
        (total, sale) => total + sale.costOfGoods,
        0
    );

    const purchases = database.purchases.reduce(
        (total, purchase) => total + purchase.total,
        0
    );

    const expenses = database.expenses.reduce(
        (total, expense) => total + expense.amount,
        0
    );

    const grossProfit = sales - costOfGoods;

    const netProfit = grossProfit - expenses;

    return {
        sales,
        costOfGoods,
        purchases,
        expenses,
        grossProfit,
        netProfit
    };
}

/* =========================
   NAVIGATION
========================= */

const pageTitles = {
    dashboard: [
        "Dashboard",
        "Business overview"
    ],

    sell: [
        "Sell",
        "Create a sales transaction"
    ],

    buy: [
        "Buy",
        "Purchase products and increase stock"
    ],

    products: [
        "Products",
        "Manage your products"
    ],

    inventory: [
        "Inventory",
        "Monitor stock"
    ],

    customers: [
        "Customers",
        "Manage customers"
    ],

    suppliers: [
        "Suppliers",
        "Manage suppliers"
    ],

    reports: [
        "Reports",
        "Sales, purchases and profit"
    ],

    settings: [
        "Settings",
        "Application settings"
    ]
};

function navigate(page) {

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });

    const title = pageTitles[page];

    if (title) {

        document.getElementById(
            "pageTitle"
        ).textContent = title[0];

        document.getElementById(
            "pageSubtitle"
        ).textContent = title[1];

    }

    if (pages[page]) {

        document.getElementById(
            "content"
        ).innerHTML = pages[page]();

    }

    if (page === "sell") {

        initializeSellPage();

    }

    if (page === "buy") {

        initializeBuyPage();

    }
}

/* =========================
   DASHBOARD
========================= */

function dashboardPage() {

    const totals = getBusinessTotals();

    const inventoryCost = database.products.reduce(
        (total, product) =>
            total +
            product.stock *
            product.cost,
        0
    );

    const inventoryRetail = database.products.reduce(
        (total, product) =>
            total +
            product.stock *
            product.price,
        0
    );

    const lowStockProducts =
        database.products.filter(
            product =>
                product.stock <=
                product.minimumStock
        );

    return `

        <div class="stats-grid">

            <div class="card stat-card">

                <div class="stat-label">
                    Total Sales
                </div>

                <div class="stat-value">
                    ${money(totals.sales)}
                </div>

                <div class="stat-note">
                    ${database.sales.length}
                    sales transactions
                </div>

            </div>


            <div class="card stat-card">

                <div class="stat-label">
                    Purchases
                </div>

                <div class="stat-value">
                    ${money(totals.purchases)}
                </div>

                <div class="stat-note">
                    ${database.purchases.length}
                    purchase transactions
                </div>

            </div>


            <div class="card stat-card">

                <div class="stat-label">
                    Gross Profit
                </div>

                <div class="stat-value">
                    ${money(totals.grossProfit)}
                </div>

                <div class="stat-note">
                    Sales minus product cost
                </div>

            </div>


            <div class="card stat-card">

                <div class="stat-label">
                    Net Profit
                </div>

                <div class="stat-value">
                    ${money(totals.netProfit)}
                </div>

                <div class="stat-note">
                    After expenses
                </div>

            </div>

        </div>


        <div class="dashboard-grid">

            <div class="card">

                <div class="section-header">

                    <h2>
                        Inventory Value
                    </h2>

                </div>

                <div class="inventory-summary">

                    <div>
                        <span>
                            Purchase Value
                        </span>

                        <strong>
                            ${money(inventoryCost)}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Retail Value
                        </span>

                        <strong>
                            ${money(inventoryRetail)}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Potential Profit
                        </span>

                        <strong>
                            ${money(
                                inventoryRetail -
                                inventoryCost
                            )}
                        </strong>
                    </div>

                </div>

            </div>


            <div class="card">

                <div class="section-header">

                    <h2>
                        Low Stock
                    </h2>

                    <button
                        class="btn secondary"
                        onclick="navigate('buy')"
                    >
                        Buy Stock
                    </button>

                </div>

                ${
                    lowStockProducts.length === 0

                    ?

                    `
                    <div class="empty-state">
                        All products have enough stock.
                    </div>
                    `

                    :

                    lowStockProducts
                        .map(product => `

                            <div class="list-row">

                                <span>
                                    <strong>
                                        ${escapeHTML(
                                            product.name
                                        )}
                                    </strong>

                                    <small>
                                        ${product.stock}
                                        units remaining
                                    </small>
                                </span>

                                <span class="badge warning">
                                    LOW
                                </span>

                            </div>

                        `)
                        .join("")
                }

            </div>

        </div>


        <div class="card">

            <div class="section-header">

                <h2>
                    Recent Sales
                </h2>

                <button
                    class="btn"
                    onclick="navigate('sell')"
                >
                    New Sale
                </button>

            </div>

            ${
                database.sales.length === 0

                ?

                `
                <div class="empty-state">
                    No sales yet.
                </div>
                `

                :

                `

                <div class="table-wrapper">

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Customer
                                </th>

                                <th>
                                    Payment
                                </th>

                                <th>
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${
                                database.sales
                                .slice(-10)
                                .reverse()
                                .map(sale => `

                                    <tr>

                                        <td>
                                            ${new Date(
                                                sale.date
                                            ).toLocaleString()}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                sale.customer
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                sale.payment
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                ${money(
                                                    sale.total
                                                )}
                                            </strong>
                                        </td>

                                    </tr>

                                `)
                                .join("")
                            }

                        </tbody>

                    </table>

                </div>

                `

            }

        </div>

    `;
}

/* =========================
   SELL PAGE
========================= */

function sellPage() {

    return `

        <div class="sell-layout">

            <div class="card">

                <div class="section-header">

                    <h2>
                        Products
                    </h2>

                    <input
                        id="sellSearch"
                        class="search-input"
                        placeholder="Search product, SKU or barcode..."
                        oninput="renderSellProducts()"
                    >

                </div>


                <div class="barcode-box">

                    <label>
                        Barcode / SKU
                    </label>

                    <input
                        id="barcodeInput"
                        placeholder="Scan barcode and press Enter"
                        onkeydown="
                            if(event.key === 'Enter'){
                                scanBarcode();
                                event.preventDefault();
                            }
                        "
                    >

                </div>


                <div
                    id="sellProducts"
                    class="product-grid"
                ></div>

            </div>


            <div class="card">

                <div class="section-header">

                    <h2>
                        Current Sale
                    </h2>

                    <button
                        class="btn secondary"
                        onclick="clearSellCart()"
                    >
                        Clear
                    </button>

                </div>


                <div class="form-grid">

                    <div class="form-field">

                        <label>
                            Customer
                        </label>

                        <input
                            id="saleCustomer"
                            placeholder="Walk-in Customer"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Payment Method
                        </label>

                        <select id="salePayment">

                            <option>
                                Cash
                            </option>

                            <option>
                                GCash
                            </option>

                            <option>
                                Bank Transfer
                            </option>

                            <option>
                                Card
                            </option>

                            <option>
                                Credit
                            </option>

                        </select>

                    </div>

                </div>


                <div
                    id="sellCart"
                    class="cart-container"
                ></div>


                <div class="form-grid">

                    <div class="form-field">

                        <label>
                            Discount
                        </label>

                        <input
                            id="saleDiscount"
                            type="number"
                            min="0"
                            value="0"
                            oninput="renderSellCart()"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Amount Received
                        </label>

                        <input
                            id="saleReceived"
                            type="number"
                            min="0"
                            value="0"
                            oninput="renderSellCart()"
                        >

                    </div>

                </div>


                <div class="sale-total">

                    <span>
                        Total
                    </span>

                    <strong id="saleTotal">
                        ₱0.00
                    </strong>

                </div>


                <div class="change-row">

                    <span>
                        Change
                    </span>

                    <strong id="saleChange">
                        ₱0.00
                    </strong>

                </div>


                <button
                    class="btn gold full-width"
                    onclick="completeSale()"
                >
                    Complete Sale
                </button>

            </div>

        </div>

    `;
}

/* =========================
   SELL INITIALIZE
========================= */

function initializeSellPage() {

    renderSellProducts();

    renderSellCart();

}

/* =========================
   PRODUCT SEARCH
========================= */

function renderSellProducts() {

    const container =
        document.getElementById(
            "sellProducts"
        );

    if (!container) return;

    const search =
        (
            document.getElementById(
                "sellSearch"
            )?.value || ""
        )
        .toLowerCase();

    const products =
        database.products.filter(
            product => {

                const text =
                    `
                    ${product.name}
                    ${product.sku}
                    ${product.barcode}
                    ${product.category}
                    `
                    .toLowerCase();

                return text.includes(search);

            }
        );

    container.innerHTML =
        products.map(product => `

            <button
                class="product-card"
                onclick="addToSellCart(${product.id})"
                ${product.stock <= 0 ? "disabled" : ""}
            >

                <strong>
                    ${escapeHTML(
                        product.name
                    )}
                </strong>

                <span>
                    ${money(
                        product.price
                    )}
                </span>

                <small>
                    Stock:
                    ${product.stock}
                </small>

                <small>
                    SKU:
                    ${escapeHTML(
                        product.sku
                    )}
                </small>

            </button>

        `).join("");

    if (!products.length) {

        container.innerHTML = `

            <div class="empty-state">
                No products found.
            </div>

        `;

    }

}

/* =========================
   BARCODE
========================= */

function scanBarcode() {

    const input =
        document.getElementById(
            "barcodeInput"
        );

    const value =
        input.value
        .trim()
        .toLowerCase();

    if (!value) return;

    const product =
        database.products.find(
            item =>
                String(item.barcode)
                    .toLowerCase() === value ||

                String(item.sku)
                    .toLowerCase() === value
        );

    if (!product) {

        showToast(
            "Product not found."
        );

        return;

    }

    if (product.stock <= 0) {

        showToast(
            "Product is out of stock."
        );

        return;

    }

    addToSellCart(product.id);

    input.value = "";

}

/* =========================
   ADD TO CART
========================= */

function addToSellCart(productId) {

    const product =
        database.products.find(
            item =>
                item.id === productId
        );

    if (!product) return;

    if (product.stock <= 0) {

        showToast(
            "Product is out of stock."
        );

        return;

    }

    const existing =
        sellCart.find(
            item =>
                item.productId ===
                productId
        );

    if (existing) {

        if (
            existing.quantity >=
            product.stock
        ) {

            showToast(
                "Not enough stock."
            );

            return;

        }

        existing.quantity++;

    } else {

        sellCart.push({

            productId,

            quantity: 1

        });

    }

    renderSellCart();

}

/* =========================
   CART RENDER
========================= */

function renderSellCart() {

    const container =
        document.getElementById(
            "sellCart"
        );

    if (!container) return;

    if (!sellCart.length) {

        container.innerHTML = `

            <div class="empty-state">
                Your cart is empty.
            </div>

        `;

    } else {

        container.innerHTML =
            sellCart.map(item => {

                const product =
                    database.products.find(
                        p =>
                            p.id ===
                            item.productId
                    );

                return `

                    <div class="cart-item">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    product.name
                                )}
                            </strong>

                            <small>
                                ${money(
                                    product.price
                                )}
                                each
                            </small>

                        </div>


                        <div class="quantity-controls">

                            <button
                                onclick="
                                    changeCartQuantity(
                                        ${product.id},
                                        -1
                                    )
                                "
                            >
                                −
                            </button>

                            <strong>
                                ${item.quantity}
                            </strong>

                            <button
                                onclick="
                                    changeCartQuantity(
                                        ${product.id},
                                        1
                                    )
                                "
                            >
                                +
                            </button>

                        </div>


                        <strong>

                            ${money(
                                product.price *
                                item.quantity
                            )}

                        </strong>


                        <button
                            class="remove-btn"
                            onclick="
                                removeFromSellCart(
                                    ${product.id}
                                )
                            "
                        >
                            ×
                        </button>

                    </div>

                `;

            }).join("");

    }

    calculateSaleTotal();

}

/* =========================
   CART QUANTITY
========================= */

function changeCartQuantity(
    productId,
    change
) {

    const item =
        sellCart.find(
            cartItem =>
                cartItem.productId ===
                productId
        );

    const product =
        database.products.find(
            p =>
                p.id === productId
        );

    if (!item || !product) return;

    const newQuantity =
        item.quantity + change;

    if (newQuantity <= 0) {

        removeFromSellCart(
            productId
        );

        return;

    }

    if (
        newQuantity >
        product.stock
    ) {

        showToast(
            "Not enough stock."
        );

        return;

    }

    item.quantity =
        newQuantity;

    renderSellCart();

}

/* =========================
   REMOVE CART ITEM
========================= */

function removeFromSellCart(
    productId
) {

    sellCart =
        sellCart.filter(
            item =>
                item.productId !==
                productId
        );

    renderSellCart();

}

/* =========================
   CLEAR CART
========================= */

function clearSellCart() {

    sellCart = [];

    renderSellCart();

}

/* =========================
   SALE TOTAL
========================= */

function calculateSaleTotal() {

    let subtotal = 0;

    let costOfGoods = 0;

    sellCart.forEach(item => {

        const product =
            database.products.find(
                p =>
                    p.id ===
                    item.productId
            );

        subtotal +=
            product.price *
            item.quantity;

        costOfGoods +=
            product.cost *
            item.quantity;

    });

    const discount =
        Number(
            document.getElementById(
                "saleDiscount"
            )?.value || 0
        );

    const total =
        Math.max(
            0,
            subtotal - discount
        );

    const received =
        Number(
            document.getElementById(
                "saleReceived"
            )?.value || 0
        );

    const change =
        Math.max(
            0,
            received - total
        );

    const totalElement =
        document.getElementById(
            "saleTotal"
        );

    const changeElement =
        document.getElementById(
            "saleChange"
        );

    if (totalElement) {

        totalElement.textContent =
            money(total);

    }

    if (changeElement) {

        changeElement.textContent =
            money(change);

    }

    return {

        subtotal,
        discount,
        total,
        received,
        change,
        costOfGoods

    };

}

/* =========================
   COMPLETE SALE
========================= */

function completeSale() {

    if (!sellCart.length) {

        showToast(
            "Please add products first."
        );

        return;

    }

    const totals =
        calculateSaleTotal();

    const customer =
        document.getElementById(
            "saleCustomer"
        ).value.trim() ||
        "Walk-in Customer";

    const payment =
        document.getElementById(
            "salePayment"
        ).value;

    if (
        payment !== "Credit" &&
        totals.received < totals.total
    ) {

        showToast(
            "Amount received is less than the total."
        );

        return;

    }

    for (const item of sellCart) {

        const product =
            database.products.find(
                p =>
                    p.id ===
                    item.productId
            );

        if (
            !product ||
            item.quantity >
            product.stock
        ) {

            showToast(
                "Not enough stock."
            );

            return;

        }

    }

    const saleItems =
        sellCart.map(item => {

            const product =
                database.products.find(
                    p =>
                        p.id ===
                        item.productId
                );

            return {

                productId:
                    product.id,

                productName:
                    product.name,

                quantity:
                    item.quantity,

                sellingPrice:
                    product.price,

                cost:
                    product.cost

            };

        });

    sellCart.forEach(item => {

        const product =
            database.products.find(
                p =>
                    p.id ===
                    item.productId
            );

        product.stock -=
            item.quantity;

        database.stockMovements.push({

            id:
                database.nextId++,

            date:
                new Date().toISOString(),

            productId:
                product.id,

            productName:
                product.name,

            type:
                "STOCK OUT",

            quantity:
                item.quantity,

            reason:
                "Sale"

        });

    });

    database.sales.push({

        id:
            database.nextId++,

        date:
            new Date().toISOString(),

        customer,

        payment,

        items:
            saleItems,

        subtotal:
            totals.subtotal,

        discount:
            totals.discount,

        total:
            totals.total,

        received:
            totals.received,

        change:
            totals.change,

        costOfGoods:
            totals.costOfGoods

    });

    saveDatabase();

    sellCart = [];

    showToast(
        "Sale completed successfully."
    );

    navigate("sell");

}

/* =========================
   BUY PAGE
========================= */

function buyPage() {

    return `

        <div class="card">

            <div class="section-header">

                <h2>
                    New Purchase
                </h2>

                <span class="badge">
                    STOCK IN
                </span>

            </div>


            <div class="form-grid">

                <div class="form-field">

                    <label>
                        Supplier
                    </label>

                    <input
                        id="buySupplier"
                        placeholder="Supplier name"
                    >

                </div>


                <div class="form-field">

                    <label>
                        Invoice / Reference
                    </label>

                    <input
                        id="buyReference"
                        placeholder="Optional"
                    >

                </div>


                <div class="form-field">

                    <label>
                        Product
                    </label>

                    <select
                        id="buyProduct"
                        onchange="setPurchaseCost()"
                    >

                        ${database.products
                            .map(product => `

                                <option
                                    value="${product.id}"
                                >

                                    ${escapeHTML(
                                        product.name
                                    )}

                                </option>

                            `)
                            .join("")}

                    </select>

                </div>


                <div class="form-field">

                    <label>
                        Quantity
                    </label>

                    <input
                        id="buyQuantity"
                        type="number"
                        min="1"
                        value="1"
                    >

                </div>


                <div class="form-field">

                    <label>
                        Purchase Cost / Unit
                    </label>

                    <input
                        id="buyCost"
                        type="number"
                        min="0"
                        step="0.01"
                    >

                </div>


                <div class="form-field">

                    <label>
                        Payment Method
                    </label>

                    <select id="buyPayment">

                        <option>
                            Cash
                        </option>

                        <option>
                            GCash
                        </option>

                        <option>
                            Bank Transfer
                        </option>

                        <option>
                            Card
                        </option>

                        <option>
                            Credit
                        </option>

                    </select>

                </div>

            </div>


            <div class="purchase-preview">

                <span>
                    Purchase Total
                </span>

                <strong id="purchaseTotal">
                    ₱0.00
                </strong>

            </div>


            <button
                class="btn gold"
                onclick="completePurchase()"
            >
                Record Purchase
            </button>

        </div>

    `;

}

/* =========================
   BUY INITIALIZE
========================= */

function initializeBuyPage() {

    setPurchaseCost();

    const quantity =
        document.getElementById(
            "buyQuantity"
        );

    const cost =
        document.getElementById(
            "buyCost"
        );

    if (quantity) {

        quantity.addEventListener(
            "input",
            updatePurchaseTotal
        );

    }

    if (cost) {

        cost.addEventListener(
            "input",
            updatePurchaseTotal
        );

    }

    updatePurchaseTotal();

}

/* =========================
   SET PURCHASE COST
========================= */

function setPurchaseCost() {

    const select =
        document.getElementById(
            "buyProduct"
        );

    const cost =
        document.getElementById(
            "buyCost"
        );

    if (!select || !cost) return;

    const product =
        database.products.find(
            p =>
                p.id ===
                Number(select.value)
        );

    if (product) {

        cost.value =
            product.cost;

    }

    updatePurchaseTotal();

}

/* =========================
   PURCHASE TOTAL
========================= */

function updatePurchaseTotal() {

    const quantity =
        Number(
            document.getElementById(
                "buyQuantity"
            )?.value || 0
        );

    const cost =
        Number(
            document.getElementById(
                "buyCost"
            )?.value || 0
        );

    const total =
        quantity * cost;

    const element =
        document.getElementById(
            "purchaseTotal"
        );

    if (element) {

        element.textContent =
            money(total);

    }

}

/* =========================
   COMPLETE PURCHASE
========================= */

function completePurchase() {

    const product =
        database.products.find(
            p =>
                p.id ===
                Number(
                    document.getElementById(
                        "buyProduct"
                    ).value
                )
        );

    const quantity =
        Number(
            document.getElementById(
                "buyQuantity"
            ).value
        );

    const cost =
        Number(
            document.getElementById(
                "buyCost"
            ).value
        );

    const supplier =
        document.getElementById(
            "buySupplier"
        ).value.trim() ||
        "Unknown Supplier";

    const reference =
        document.getElementById(
            "buyReference"
        ).value.trim();

    const payment =
        document.getElementById(
            "buyPayment"
        ).value;

    if (!product) {

        showToast(
            "Please select a product."
        );

        return;

    }

    if (
        quantity <= 0 ||
        cost < 0
    ) {

        showToast(
            "Check the purchase quantity and cost."
        );

        return;

    }

    const total =
        quantity * cost;

    product.stock +=
        quantity;

    product.cost =
        cost;

    database.purchases.push({

        id:
            database.nextId++,

        date:
            new Date().toISOString(),

        supplier,

        reference,

        productId:
            product.id,

        productName:
            product.name,

        quantity,

        cost,

        total,

        payment

    });

    database.stockMovements.push({

        id:
            database.nextId++,

        date:
            new Date().toISOString(),

        productId:
            product.id,

        productName:
            product.name,

        type:
            "STOCK IN",

        quantity,

        reason:
            "Purchase"

    });

    saveDatabase();

    showToast(
        "Purchase recorded. Stock increased."
    );

    navigate("buy");

}

/* =========================
   PRODUCTS PAGE
========================= */

function productsPage() {

    return `

        <div class="card">

            <div class="section-header">

                <h2>
                    Product Catalog
                </h2>

                <button
                    class="btn"
                    onclick="addProduct()"
                >
                    + Add Product
                </button>

            </div>


            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>
                                Product
                            </th>

                            <th>
                                SKU
                            </th>

                            <th>
                                Barcode
                            </th>

                            <th>
                                Category
                            </th>

                            <th>
                                Cost
                            </th>

                            <th>
                                Selling Price
                            </th>

                            <th>
                                Stock
                            </th>

                            <th>
                                Status
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${database.products
                            .map(product => `

                                <tr>

                                    <td>
                                        <strong>
                                            ${escapeHTML(
                                                product.name
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            product.sku
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            product.barcode
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            product.category
                                        )}
                                    </td>

                                    <td>
                                        ${money(
                                            product.cost
                                        )}
                                    </td>

                                    <td>
                                        ${money(
                                            product.price
                                        )}
                                    </td>

                                    <td>
                                        ${product.stock}
                                    </td>

                                    <td>

                                        ${
                                            product.stock <= 0

                                            ?

                                            `<span class="badge danger">
                                                OUT
                                            </span>`

                                            :

                                            product.stock <=
                                            product.minimumStock

                                            ?

                                            `<span class="badge warning">
                                                LOW
                                            </span>`

                                            :

                                            `<span class="badge success">
                                                OK
                                            </span>`
                                        }

                                    </td>

                                </tr>

                            `)
                            .join("")}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}

/* =========================
   ADD PRODUCT
========================= */

function addProduct() {

    const name =
        prompt(
            "Product name:"
        );

    if (!name) return;

    const sku =
        prompt(
            "SKU:"
        ) ||
        "SKU-" +
        database.nextId;

    const barcode =
        prompt(
            "Barcode:"
        ) ||
        "";

    const category =
        prompt(
            "Category:"
        ) ||
        "General";

    const cost =
        Number(
            prompt(
                "Purchase cost:",
                "0"
            )
        ) || 0;

    const price =
        Number(
            prompt(
                "Selling price:",
                "0"
            )
        ) || 0;

    const stock =
        Number(
            prompt(
                "Starting stock:",
                "0"
            )
        ) || 0;

    const minimumStock =
        Number(
            prompt(
                "Low-stock warning level:",
                "1"
            )
        ) || 1;

    database.products.push({

        id:
            database.nextId++,

        name,

        sku,

        barcode,

        category,

        cost,

        price,

        stock,

        minimumStock

    });

    saveDatabase();

    showToast(
        "Product added."
    );

    navigate("products");

}

/* =========================
   INVENTORY PAGE
========================= */

function inventoryPage() {

    return `

        <div class="card">

            <div class="section-header">

                <h2>
                    Inventory
                </h2>

            </div>


            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>
                                Product
                            </th>

                            <th>
                                Stock
                            </th>

                            <th>
                                Purchase Value
                            </th>

                            <th>
                                Retail Value
                            </th>

                            <th>
                                Potential Profit
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${database.products
                            .map(product => {

                                const costValue =
                                    product.stock *
                                    product.cost;

                                const retailValue =
                                    product.stock *
                                    product.price;

                                return `

                                    <tr>

                                        <td>
                                            ${escapeHTML(
                                                product.name
                                            )}
                                        </td>

                                        <td>
                                            ${product.stock}
                                        </td>

                                        <td>
                                            ${money(
                                                costValue
                                            )}
                                        </td>

                                        <td>
                                            ${money(
                                                retailValue
                                            )}
                                        </td>

                                        <td>
                                            ${money(
                                                retailValue -
                                                costValue
                                            )}
                                        </td>

                                    </tr>

                                `;

                            })
                            .join("")}

                    </tbody>

                </table>

            </div>

        </div>


        <div class="card">

            <div class="section-header">

                <h2>
                    Recent Stock Movements
                </h2>

            </div>

            ${
                database.stockMovements.length === 0

                ?

                `
                <div class="empty-state">
                    No stock movements yet.
                </div>
                `

                :

                `

                <div class="table-wrapper">

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Product
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Reason
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${database.stockMovements
                                .slice(-20)
                                .reverse()
                                .map(move => `

                                    <tr>

                                        <td>
                                            ${new Date(
                                                move.date
                                            ).toLocaleString()}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                move.productName
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                move.type
                                            )}
                                        </td>

                                        <td>
                                            ${move.quantity}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                move.reason
                                            )}
                                        </td>

                                    </tr>

                                `)
                                .join("")}

                        </tbody>

                    </table>

                </div>

                `

            }

        </div>

    `;

}

/* =========================
   CUSTOMERS
========================= */

function customersPage() {

    return directoryPage(
        "Customers",
        "customers"
    );

}

/* =========================
   SUPPLIERS
========================= */

function suppliersPage() {

    return directoryPage(
        "Suppliers",
        "suppliers"
    );

}

/* =========================
   DIRECTORY
========================= */

function directoryPage(
    title,
    type
) {

    const records =
        database[type];

    return `

        <div class="card">

            <div class="section-header">

                <h2>
                    ${title}
                </h2>

                <button
                    class="btn"
                    onclick="addDirectoryRecord('${type}')"
                >
                    + Add
                </button>

            </div>


            ${
                records.length === 0

                ?

                `
                <div class="empty-state">
                    No records yet.
                </div>
                `

                :

                `

                <div class="table-wrapper">

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Phone
                                </th>

                                <th>
                                    Email
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${records
                                .map(record => `

                                    <tr>

                                        <td>
                                            ${escapeHTML(
                                                record.name
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                record.phone
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                record.email
                                            )}
                                        </td>

                                    </tr>

                                `)
                                .join("")}

                        </tbody>

                    </table>

                </div>

                `

            }

        </div>

    `;

}

/* =========================
   ADD CUSTOMER / SUPPLIER
========================= */

function addDirectoryRecord(
    type
) {

    const name =
        prompt(
            "Name:"
        );

    if (!name) return;

    const phone =
        prompt(
            "Phone:"
        ) ||
        "";

    const email =
        prompt(
            "Email:"
        ) ||
        "";

    database[type].push({

        id:
            database.nextId++,

        name,

        phone,

        email

    });

    saveDatabase();

    showToast(
        "Record added."
    );

    navigate(type);

}

/* =========================
   REPORTS
========================= */

function reportsPage() {

    const totals =
        getBusinessTotals();

    return `

        <div class="stats-grid">

            <div class="card stat-card">

                <div class="stat-label">
                    Sales Revenue
                </div>

                <div class="stat-value">
                    ${money(
                        totals.sales
                    )}
                </div>

            </div>


            <div class="card stat-card">

                <div class="stat-label">
                    Cost of Goods Sold
                </div>

                <div class="stat-value">
                    ${money(
                        totals.costOfGoods
                    )}
                </div>

            </div>


            <div class="card stat-card">

                <div class="stat-label">
                    Expenses
                </div>

                <div class="stat-value">
                    ${money(
                        totals.expenses
                    )}
                </div>

            </div>


            <div class="card stat-card">

                <div class="stat-label">
                    Net Profit
                </div>

                <div class="stat-value">
                    ${money(
                        totals.netProfit
                    )}
                </div>

            </div>

        </div>


        <div class="card">

            <div class="section-header">

                <h2>
                    Expenses
                </h2>

                <button
                    class="btn"
                    onclick="addExpense()"
                >
                    + Add Expense
                </button>

            </div>


            ${
                database.expenses.length === 0

                ?

                `
                <div class="empty-state">
                    No expenses recorded.
                </div>
                `

                :

                database.expenses
                    .slice()
                    .reverse()
                    .map(expense => `

                        <div class="list-row">

                            <span>

                                <strong>
                                    ${escapeHTML(
                                        expense.description
                                    )}
                                </strong>

                                <small>
                                    ${new Date(
                                        expense.date
                                    ).toLocaleDateString()}
                                </small>

                            </span>

                            <strong>
                                ${money(
                                    expense.amount
                                )}
                            </strong>

                        </div>

                    `)
                    .join("")

            }

        </div>

    `;

}

/* =========================
   EXPENSE
========================= */

function addExpense() {

    const description =
        prompt(
            "Expense description:"
        );

    if (!description) return;

    const amount =
        Number(
            prompt(
                "Expense amount:",
                "0"
            )
        );

    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Invalid amount."
        );

        return;

    }

    database.expenses.push({

        id:
            database.nextId++,

        date:
            new Date().toISOString(),

        description,

        amount

    });

    saveDatabase();

    showToast(
        "Expense recorded."
    );

    navigate("reports");

}

/* =========================
   SETTINGS
========================= */

function settingsPage() {

    return `

        <div class="card">

            <h2>
                Phase 2
            </h2>

            <p>
                Points of Buy & Sell
                currently stores data
                in this browser.
            </p>

            <p>
                Cloud database,
                user accounts,
                multi-device synchronization
                and secure backups will be
                added in the production phase.
            </p>


            <button
                class="btn danger"
                onclick="resetDatabase()"
            >
                Reset Local Data
            </button>

        </div>

    `;

}

/* =========================
   RESET
========================= */

function resetDatabase() {

    if (
        !confirm(
            "Reset all local application data?"
        )
    ) {

        return;

    }

    localStorage.removeItem(
        STORAGE_KEY
    );

    location.reload();

}

/* =========================
   PAGE LIST
========================= */

const pages = {

    dashboard:
        dashboardPage,

    sell:
        sellPage,

    buy:
        buyPage,

    products:
        productsPage,

    inventory:
        inventoryPage,

    customers:
        customersPage,

    suppliers:
        suppliersPage,

    reports:
        reportsPage,

    settings:
        settingsPage

};

/* =========================
   NAV BUTTONS
========================= */

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".nav-btn"
            );

        if (!button) return;

                navigate(
            button.dataset.page
        );

        // Close sidebar after selecting a page on mobile
        const sidebar =
            document.querySelector(
                ".sidebar"
            );

        if (
            sidebar &&
            window.innerWidth <= 800
        ) {
            sidebar.classList.remove(
                "open"
            );
        }

    }
);

/* =========================
   MOBILE MENU
========================= */

const menuButton =
    document.getElementById(
        "menuBtn"
    );

if (menuButton) {

    menuButton.addEventListener(
        "click",
        function() {

            const sidebar =
                document.querySelector(
                    ".sidebar"
                );

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}

/* =========================
   DATE
========================= */

const today =
    document.getElementById(
        "today"
    );

if (today) {

    today.textContent =
        new Date().toLocaleDateString(
            "en-PH",
            {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

}

/* =========================
   START APPLICATION
========================= */

navigate("dashboard");
