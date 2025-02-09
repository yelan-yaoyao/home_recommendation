// Utility function to format price in Indian currency format
function formatIndianPrice(price) {
    const priceString = price.toString();
    const lastThree = priceString.substring(priceString.length - 3);
    const otherNumbers = priceString.substring(0, priceString.length - 3);
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    return "₹" + formatted;
}

// House card template
function createHouseCard(house) {
    return `
        <div class="house-card" data-house-id="${house.id}">
            <img src="${house.image}" alt="${house.title}">
            <div class="house-card-content">
                <h3>${house.title}</h3>
                <p class="house-price">${formatIndianPrice(house.price)}</p>
                <div class="house-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${house.city}, ${house.state}
                </div>
                <div class="house-stats">
                    <div><i class="fas fa-bed"></i> ${house.beds} beds</div>
                    <div><i class="fas fa-bath"></i> ${house.baths} baths</div>
                    <div><i class="fas fa-ruler"></i> ${house.sqft} sqft</div>
                </div>
            </div>
        </div>
    `;
}

// Dialog content template
function createDialogContent(house) {
    const temp = Math.floor(Math.random() * 15) + 20; // 20-35°C
    const humidity = Math.floor(Math.random() * 30) + 40; // 40-70%

    return `
        <h2>${house.title}</h2>
        <div class="dialog-grid">
            <div>
                <img src="${house.image}" alt="${house.title}" style="width: 100%; border-radius: var(--radius);">
                <p class="house-price">${formatIndianPrice(house.price)}</p>
                <p>${house.description}</p>
                <div class="house-stats">
                    <div><i class="fas fa-bed"></i> ${house.beds} beds</div>
                    <div><i class="fas fa-bath"></i> ${house.baths} baths</div>
                    <div><i class="fas fa-ruler"></i> ${house.sqft} sqft</div>
                </div>
                <div class="house-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${house.city}, ${house.state}
                </div>
            </div>
            <div>
                <h3><i class="fas fa-thermometer-half"></i> Current Weather</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="padding: 1rem; background: var(--muted); border-radius: var(--radius);">
                        <div style="font-size: 1.5rem; font-weight: bold;">${temp}°C</div>
                        <div>Temperature</div>
                    </div>
                    <div style="padding: 1rem; background: var(--muted); border-radius: var(--radius);">
                        <div style="font-size: 1.5rem; font-weight: bold;">${humidity}%</div>
                        <div>Humidity</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initMap(house) {
    const coordinates = {
        'Delhi': [28.6139, 77.2090],
        'Mumbai': [19.0760, 72.8777],
        'Bangalore': [12.9716, 77.5946],
        'Chennai': [13.0827, 80.2707],
        'Hyderabad': [17.3850, 78.4867],
        'Ahmedabad': [23.0225, 72.5714],
        'Kolkata': [22.5726, 88.3639]
    };

    const map = L.map('house-map').setView(coordinates[house.city], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.marker(coordinates[house.city])
        .bindPopup(`<b>${house.title}</b><br>${house.price}`)
        .addTo(map);

    map.on('click', function(e) {
        const clickedPoint = e.latlng;
        const nearbyHouses = findNearbyHouses(clickedPoint, app.houses);

        if (nearbyHouses.length > 0) {
            nearbyHouses.forEach(house => {
                L.marker(coordinates[house.city])
                    .bindPopup(`<b>${house.title}</b><br>${formatIndianPrice(house.price)}`)
                    .addTo(map);
            });
        } else {
            L.popup()
                .setLatLng(clickedPoint)
                .setContent('No houses found in this area')
                .openOn(map);
        }
    });
}

function findNearbyHouses(point, houses) {
    const nearbyHouses = houses.filter(house => {
        const random = Math.random();
        return random > 0.7; 
    });
    return nearbyHouses;
}

class AuthManager {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.loadUsers();
    }

    async loadUsers() {
        try {
            const response = await fetch('users.json');
            const data = await response.json();
            this.users = data.users;
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async saveUsers() {
        try {
            const response = await fetch('users.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ users: this.users })
            });
            if (!response.ok) throw new Error('Failed to save users');
        } catch (error) {
            console.error('Failed to save users:', error);
        }
    }

    async signup(name, email, password) {
        if (this.users.some(u => u.email === email)) {
            throw new Error('Email already exists');
        }

        const user = {
            id: Date.now(),
            name,
            email,
            password 
        };

        this.users.push(user);
        await this.saveUsers();
        this.currentUser = user;
        return user;
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Invalid credentials');
        this.currentUser = user;
        return user;
    }

    logout() {
        this.currentUser = null;
    }
}

class App {
    constructor() {
        this.houses = [];
        this.filters = {
            maxPrice: Infinity,
            city: '',
            state: ''
        };
        this.auth = new AuthManager();

        this.init();
    }

    async init() {
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            this.houses = data.houses;

            this.initializeFilters();
            this.renderHouses();
            this.setupEventListeners();
            this.setupContactForm();
            this.setupAuthForms();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    initializeFilters() {
        const cities = [...new Set(this.houses.map(h => h.city))];
        const states = [...new Set(this.houses.map(h => h.state))];

        const citySelect = document.getElementById('city-filter');
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });

        const stateSelect = document.getElementById('state-filter');
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        document.getElementById('price-filter').addEventListener('input', (e) => {
            this.filters.maxPrice = e.target.value ? Number(e.target.value) : Infinity;
            this.renderHouses();
        });

        document.getElementById('city-filter').addEventListener('change', (e) => {
            this.filters.city = e.target.value;
            this.renderHouses();
        });

        document.getElementById('state-filter').addEventListener('change', (e) => {
            this.filters.state = e.target.value;
            this.renderHouses();
        });

        document.querySelector('.houses-grid').addEventListener('click', (e) => {
            const card = e.target.closest('.house-card');
            if (card) {
                const houseId = Number(card.dataset.houseId);
                const house = this.houses.find(h => h.id === houseId);
                if (house) {
                    this.showHouseDialog(house);
                }
            }
        });

        document.querySelector('.close-dialog').addEventListener('click', () => {
            document.getElementById('house-dialog').classList.remove('open');
        });
    }

    setupContactForm() {
        document.getElementById('contact-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            console.log('Contact form submitted:', formData);
            alert('Message sent! We will get back to you soon.');
            e.target.reset();
        });
    }

    filterHouses() {
        return this.houses.filter(house => {
            return (
                house.price <= this.filters.maxPrice &&
                (!this.filters.city || house.city === this.filters.city) &&
                (!this.filters.state || house.state === this.filters.state)
            );
        });
    }

    renderHouses() {
        const filteredHouses = this.filterHouses();
        const housesGrid = document.querySelector('.houses-grid');
        housesGrid.innerHTML = filteredHouses.map(house => createHouseCard(house)).join('');

        const trendingHouses = this.houses.filter(h => h.trending === 1);
        const trendingSlider = document.querySelector('.trending-slider');
        trendingSlider.innerHTML = trendingHouses.map(house => createHouseCard(house)).join('');
    }

    showHouseDialog(house) {
        const dialog = document.getElementById('house-dialog');
        dialog.querySelector('.dialog-body').innerHTML = createDialogContent(house);
        dialog.classList.add('open');

        initMap(house);

        const buyButton = dialog.querySelector('.buy-now-btn');
        buyButton.onclick = () => {
            if (!this.auth.currentUser) {
                alert('Please login to buy this property');
                return;
            }
            alert(`Thank you for your interest in buying ${house.title}! Our team will contact you soon.`);
        };
    }

    setupAuthForms() {
        document.getElementById('loginBtn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-dialog').classList.add('open');
        });

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                await this.auth.login(email, password);
                document.getElementById('login-dialog').classList.remove('open');
                alert('Login successful!');
            } catch (error) {
                alert(error.message);
            }
        });

        document.getElementById('signupBtn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-dialog').classList.add('open');
        });

        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                await this.auth.signup(name, email, password);
                document.getElementById('signup-dialog').classList.remove('open');
                alert('Signup successful!');
            } catch (error) {
                alert(error.message);
            }
        });

        document.querySelectorAll('.close-dialog').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.dialog').forEach(dialog => {
                    dialog.classList.remove('open');
                });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});