const productsDOM = document.querySelector(".products-center");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const removeItem = document.querySelector(".remove-item");
let cart = [];

class Product {
    async getProducts() {
        try {
            const result = await fetch("products.json")
            const data = await result.json()
            let products = data.items;
            products = products.map(item => {
                const {title, price} = item.fields;
                const id = item.sys.id;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image }
            })
            return products
        }catch(error) {
            return error
        }
    }
}

class View {
    displayProducts(products) {
        let result = ""; // helper variable
        products.forEach(item => { // create dinamice product in DOM
            result += `
                <article class="product">
                    <div class="img-container">
                        <img
                        src="${item.image}"
                        alt="${item.title}"
                        class="product-img"
                        />
                        <button class="bag-btn" data-id="${item.id}">افزودن به سبد خرید</button>
                    </div>
                    <h3>محصول اول</h3>
                    <h4>${item.price} تومان</h4>
                </article>
            `
        })
        productsDOM.innerHTML = result;
    }

    getCartButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")]; // return all buttons data in array
        buttons.forEach(item => {
            const id = item.dataset.id; // button id
            item.addEventListener("click", (e) => { // button event
                let cartItem = {...Storage.getProduct(id), amount: 1}; //button data object
                cart.push(cartItem) // push objects in cart
                Storage.saveCartItems(cart) //save cart in localstorage cartItems
                this.setCardsValues(cart) // add amount and total price in cart
                this.addCartItem(cartItem) // add product in checkout cart
                this.showCart() // open checkout cart
            })
        })
    }

    setCardsValues(cart) {
        let totalPrice = 0;
        let totalItems = 0;

        cart.map(item => {
            totalPrice = totalPrice + item.price * item.amount
            totalItems = totalItems + item.amount
        })

        cartTotal.innerText = totalPrice;
        cartItems.innerText = totalItems;
    }

    addCartItem(item) {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" />
                    <div>
                        <h4>${item.title}</h4>
                        <h5>${item.price}</h5>
                        <span class="remove-item" data-id="${item.id}">حذف</span>
                    </div>
                    <div>
                        <i class="fas fa-chevron-up" data-id="${item.id}"></i>
                        <p class="item-amount">${item.amount}</p>
                        <i class="fas fa-chevron-down" data-id="${item.id}"></i>
                    </div>
        </div>
        `
        cartContent.appendChild(div);
    }

    showCart() {
        cartOverlay.classList.add("transparentBcg")
        cartDOM.classList.add("showCart")
    }

    closeCart() {
        cartOverlay.classList.remove("transparentBcg")
        cartDOM.classList.remove("showCart")
    }

    cartProcess() {
        clearCartBtn.addEventListener("click", () => {
            this.clearCart()
        })

        cartContent.addEventListener("click", (e) => {
            if(e.target.classList.contains("remove-item")) {
                const removeItem = e.target;
                let id = removeItem.dataset.id;
                
                cartContent.removeChild(removeItem.parentElement.parentElement.parentElement);
                this.removeProduct(id);
            }

            if (e.target.classList.contains("fa-chevron-up")) {
                const addAmount = e.target;
                let id = addAmount.dataset.id;

                let product = cart.find(item => {
                    return item.id === id
                })

                product.amount = product.amount + 1;
                Storage.saveCartItems(cart)
                this.setCardsValues(cart)

                addAmount.nextElementSibling.innerText = product.amount
            }

            if (e.target.classList.contains("fa-chevron-down")) {
                let lowerAmount = e.target;
                let id = lowerAmount.dataset.id
                
                let product = cart.find(item => {
                    return item.id === id
                })

                product.amount = product.amount - 1;
                if (product.amount > 0) {
                    Storage.saveCartItems(cart)
                    this.setCardsValues(cart)
                    lowerAmount.previousElementSibling.innerText = product.amount;
                }else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement.parentElement);
                    this.removeProduct(id);
                }
            }
        })
    }

    clearCart() {
        let cartItems = cart.map(item => {
            return item.id
        })

        cartItems.forEach(item => {
            return this.removeProduct(item)
        })

        while(cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0])
        }
    }

    removeProduct(ID) {
        cart = cart.filter(item => {
            return item.id != ID
        })

        this.setCardsValues(cart);
        Storage.saveCartItems(cart);
    }

    initApp() {
        cart = Storage.getCart(); // return checkout product if exist
        this.setCardsValues(cart); // return amount and total price in cart
        this.populate(cart); // create checkout product
        cartBtn.addEventListener("click", this.showCart) // open checkout part when click
        closeCartBtn.addEventListener("click", this.closeCart) // close checkout part when click
    }

    populate(cart) {
        cart.forEach(item => {
            return this.addCartItem(item)
        })
    }
}

class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products)); // save all product data
    }

    static saveCartItems(products) {
        localStorage.setItem("cartItems", JSON.stringify(products))
    }

    static getProduct(ID) { 
        const products = JSON.parse(localStorage.getItem("products"));
        return products.find(item => {
            return item.id === ID
        })
    }

    static getCart() {
        return localStorage.getItem("cartItems") ? JSON.parse(localStorage.getItem("cartItems")) : [];
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const product = new Product();
    const view = new View();

    product.getProducts()
        .then(res => {
            view.displayProducts(res); // display products
            Storage.saveProducts(res); // save products data
        }).then(() => {
            view.getCartButtons() // product add buttons
            view.initApp() // initial App
            view.cartProcess() // increase and dicease product in checkout
        }).catch(err => console.log(err)) // run when error exist
});
