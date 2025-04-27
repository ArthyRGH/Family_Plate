import * as supabaseService from './supabase.js';
import * as mealPlanner from './mealplanner.js';

// DOM Elements
let currentUser = null;
let isAuthenticated = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  // Test Supabase connection
  const { data, error } = await supabaseService.testConnection();
  if (error) {
    console.error('Supabase connection failed:', error);
    alert('Failed to connect to Supabase. Check console for details.');
  } else {
    console.log('Supabase connection successful:', data);
  }
  
  // Check if the user is logged in
  const { user, error: supabaseError } = await supabaseService.getCurrentUser();
  
  if (user) {
    currentUser = user;
    isAuthenticated = true;
    setupAuthenticatedUI();
  } else {
    setupUnauthenticatedUI();
  }
  
  // Add event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Handle page-specific initialization based on current URL
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('index.html') || currentPath === '/') {
    setupHomePage();
  } else if (currentPath.includes('login.html')) {
    setupLoginPage();
  } else if (currentPath.includes('register.html')) {
    setupRegisterPage();
  } else if (currentPath.includes('dashboard.html')) {
    setupDashboardPage();
  } else if (currentPath.includes('meal-plan.html')) {
    setupMealPlanPage();
  }
}

function setupAuthenticatedUI() {
  // Update the UI for authenticated users
  const authLinks = document.querySelectorAll('.auth-link');
  const nonAuthLinks = document.querySelectorAll('.non-auth-link');
  
  authLinks.forEach(link => link.style.display = 'block');
  nonAuthLinks.forEach(link => link.style.display = 'none');
  
  // Update user info
  const userInfoElements = document.querySelectorAll('.user-info');
  userInfoElements.forEach(el => {
    el.textContent = `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`;
  });
}

function setupUnauthenticatedUI() {
  // Update the UI for non-authenticated users
  const authLinks = document.querySelectorAll('.auth-link');
  const nonAuthLinks = document.querySelectorAll('.non-auth-link');
  
  authLinks.forEach(link => link.style.display = 'none');
  nonAuthLinks.forEach(link => link.style.display = 'block');
}

// Page-specific setup functions
function setupHomePage() {
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    if (isAuthenticated) {
      heroSection.innerHTML = `
        <h1>Welcome back, ${currentUser.user_metadata?.first_name || 'User'}!</h1>
        <p>Continue planning your meals for the week.</p>
        <a href="dashboard.html" class="cta-button">Go to Dashboard</a>
      `;
    } else {
      heroSection.innerHTML = `
        <h1>Plan Your Family Meals with Ease</h1>
        <p>Organize your weekly meals, generate shopping lists, and save time.</p>
        <a href="register.html" class="cta-button">Get Started</a>
      `;
    }
  }
}

function setupLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const messageElement = document.getElementById('login-message');
      
      if (!email || !password) {
        messageElement.textContent = 'Please enter both email and password.';
        messageElement.classList.add('error-message');
        return;
      }
      
      // Show loading state
      const submitButton = loginForm.querySelector('button[type="submit"]');
      submitButton.innerHTML = 'Logging in...';
      submitButton.disabled = true;
      
      const { data, error } = await supabaseService.signIn(email, password);
      
      // Reset button
      submitButton.innerHTML = 'Login';
      submitButton.disabled = false;
      
      if (error) {
        messageElement.textContent = error.message || 'Login failed. Please try again.';
        messageElement.classList.add('error-message');
      } else {
        // Successful login
        messageElement.textContent = 'Login successful. Redirecting...';
        messageElement.classList.remove('error-message');
        messageElement.classList.add('success-message');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      }
    });
  }
}

function setupRegisterPage() {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const messageElement = document.getElementById('register-message');
      
      // Basic validation
      if (!firstName || !lastName || !email || !password) {
        messageElement.textContent = 'Please fill out all required fields.';
        messageElement.classList.add('error-message');
        return;
      }
      
      if (password !== confirmPassword) {
        messageElement.textContent = 'Passwords do not match.';
        messageElement.classList.add('error-message');
        return;
      }
      
      // Show loading state
      const submitButton = registerForm.querySelector('button[type="submit"]');
      submitButton.innerHTML = 'Creating account...';
      submitButton.disabled = true;
      
      const { data, error } = await supabaseService.signUp(email, password, firstName, lastName);
      
      // Reset button
      submitButton.innerHTML = 'Register';
      submitButton.disabled = false;
      
      if (error) {
        messageElement.textContent = error.message || 'Registration failed. Please try again.';
        messageElement.classList.add('error-message');
      } else {
        // Successful registration
        messageElement.textContent = 'Registration successful. Please check your email for confirmation.';
        messageElement.classList.remove('error-message');
        messageElement.classList.add('success-message');
        
        // Redirect to login page after a delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      }
    });
  }
}

function setupDashboardPage() {
  if (!isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize the dashboard elements
  const recipesSection = document.querySelector('.recipes-section');
  const mealPlansSection = document.querySelector('.meal-plans-section');
  const shoppingListsSection = document.querySelector('.shopping-lists-section');
  
  // Load user data
  loadUserRecipes(recipesSection);
  loadUserMealPlans(mealPlansSection);
  loadUserShoppingLists(shoppingListsSection);
  
  // Set up logout button
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      const { error } = await supabaseService.signOut();
      if (!error) {
        window.location.href = 'index.html';
      }
    });
  }
}

function setupMealPlanPage() {
  if (!isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize the meal planner
  mealPlanner.initializeMealPlanner();
}

// Data loading functions
async function loadUserRecipes(container) {
  if (!container) return;
  
  const loadingElement = document.createElement('div');
  loadingElement.classList.add('loading-indicator');
  loadingElement.textContent = 'Loading your recipes...';
  container.appendChild(loadingElement);
  
  const { data, error } = await supabaseService.getRecipes(currentUser.id);
  
  container.removeChild(loadingElement);
  
  if (error) {
    container.innerHTML = `<div class="error-message">Error loading recipes: ${error.message}</div>`;
    return;
  }
  
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>You don't have any recipes yet.</p>
        <button class="add-button" id="add-recipe-button">Add Your First Recipe</button>
      </div>
    `;
    
    const addRecipeButton = document.getElementById('add-recipe-button');
    if (addRecipeButton) {
      addRecipeButton.addEventListener('click', () => {
        // Open add recipe modal or navigate to add recipe page
        console.log('Add recipe clicked');
      });
    }
    
    return;
  }
  
  // Render recipes
  const recipesHTML = data.map(recipe => `
    <div class="recipe-card" data-id="${recipe.id}">
      <h3>${recipe.title}</h3>
      <p>${recipe.description || 'No description'}</p>
      <div class="recipe-meta">
        <span>Prep: ${recipe.preparation_time || '?'} min</span>
        <span>Cook: ${recipe.cooking_time || '?'} min</span>
        <span>Servings: ${recipe.servings || '?'}</span>
      </div>
      <div class="recipe-actions">
        <button class="view-recipe" data-id="${recipe.id}">View</button>
        <button class="edit-recipe" data-id="${recipe.id}">Edit</button>
        <button class="delete-recipe" data-id="${recipe.id}">Delete</button>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = `
    <div class="section-header">
      <h2>Your Recipes</h2>
      <button class="add-button" id="add-recipe-button">Add New Recipe</button>
    </div>
    <div class="recipes-grid">
      ${recipesHTML}
    </div>
  `;
  
  // Add event listeners to recipe buttons
  setupRecipeEventListeners();
}

async function loadUserMealPlans(container) {
  if (!container) return;
  
  const loadingElement = document.createElement('div');
  loadingElement.classList.add('loading-indicator');
  loadingElement.textContent = 'Loading your meal plans...';
  container.appendChild(loadingElement);
  
  const { data, error } = await supabaseService.getMealPlans(currentUser.id);
  
  container.removeChild(loadingElement);
  
  if (error) {
    container.innerHTML = `<div class="error-message">Error loading meal plans: ${error.message}</div>`;
    return;
  }
  
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>You don't have any meal plans yet.</p>
        <button class="add-button" id="create-meal-plan-button">Create Your First Meal Plan</button>
      </div>
    `;
    
    const addMealPlanButton = document.getElementById('create-meal-plan-button');
    if (addMealPlanButton) {
      addMealPlanButton.addEventListener('click', () => {
        window.location.href = 'meal-plan.html';
      });
    }
    
    return;
  }
  
  // Render meal plans
  const mealPlansHTML = data.map(plan => {
    const startDate = new Date(plan.start_date).toLocaleDateString();
    const endDate = new Date(plan.end_date).toLocaleDateString();
    
    return `
      <div class="meal-plan-card" data-id="${plan.id}">
        <h3>${plan.title}</h3>
        <p>${startDate} to ${endDate}</p>
        <div class="meal-plan-actions">
          <button class="view-meal-plan" data-id="${plan.id}">View</button>
          <button class="edit-meal-plan" data-id="${plan.id}">Edit</button>
          <button class="delete-meal-plan" data-id="${plan.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="section-header">
      <h2>Your Meal Plans</h2>
      <button class="add-button" id="create-meal-plan-button">Create New Meal Plan</button>
    </div>
    <div class="meal-plans-grid">
      ${mealPlansHTML}
    </div>
  `;
  
  // Add event listeners to meal plan buttons
  setupMealPlanEventListeners();
}

async function loadUserShoppingLists(container) {
  if (!container) return;
  
  const loadingElement = document.createElement('div');
  loadingElement.classList.add('loading-indicator');
  loadingElement.textContent = 'Loading your shopping lists...';
  container.appendChild(loadingElement);
  
  const { data, error } = await supabaseService.getShoppingLists(currentUser.id);
  
  container.removeChild(loadingElement);
  
  if (error) {
    container.innerHTML = `<div class="error-message">Error loading shopping lists: ${error.message}</div>`;
    return;
  }
  
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>You don't have any shopping lists yet.</p>
        <button class="add-button" id="create-shopping-list-button">Create Your First Shopping List</button>
      </div>
    `;
    
    const addShoppingListButton = document.getElementById('create-shopping-list-button');
    if (addShoppingListButton) {
      addShoppingListButton.addEventListener('click', () => {
        // Open add shopping list modal or navigate to add shopping list page
        console.log('Add shopping list clicked');
      });
    }
    
    return;
  }
  
  // Render shopping lists
  const shoppingListsHTML = data.map(list => {
    const createdDate = new Date(list.created_at).toLocaleDateString();
    
    return `
      <div class="shopping-list-card" data-id="${list.id}">
        <h3>${list.title}</h3>
        <p>Created: ${createdDate}</p>
        <div class="shopping-list-actions">
          <button class="view-shopping-list" data-id="${list.id}">View</button>
          <button class="edit-shopping-list" data-id="${list.id}">Edit</button>
          <button class="delete-shopping-list" data-id="${list.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="section-header">
      <h2>Your Shopping Lists</h2>
      <button class="add-button" id="create-shopping-list-button">Create New Shopping List</button>
    </div>
    <div class="shopping-lists-grid">
      ${shoppingListsHTML}
    </div>
  `;
  
  // Add event listeners to shopping list buttons
  setupShoppingListEventListeners();
}

// Event listener setup functions
function setupRecipeEventListeners() {
  // View recipe buttons
  document.querySelectorAll('.view-recipe').forEach(button => {
    button.addEventListener('click', (e) => {
      const recipeId = e.target.getAttribute('data-id');
      // Navigate to recipe view or open modal
      console.log('View recipe:', recipeId);
    });
  });
  
  // Edit recipe buttons
  document.querySelectorAll('.edit-recipe').forEach(button => {
    button.addEventListener('click', (e) => {
      const recipeId = e.target.getAttribute('data-id');
      // Navigate to recipe edit page or open edit modal
      console.log('Edit recipe:', recipeId);
    });
  });
  
  // Delete recipe buttons
  document.querySelectorAll('.delete-recipe').forEach(button => {
    button.addEventListener('click', async (e) => {
      const recipeId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this recipe?')) {
        const { error } = await supabaseService.deleteRecipe(recipeId);
        if (!error) {
          // Reload recipes section
          const recipesSection = document.querySelector('.recipes-section');
          loadUserRecipes(recipesSection);
        } else {
          console.error('Error deleting recipe:', error);
          alert('Failed to delete recipe. Please try again.');
        }
      }
    });
  });
  
  // Add recipe button
  const addRecipeButton = document.getElementById('add-recipe-button');
  if (addRecipeButton) {
    addRecipeButton.addEventListener('click', () => {
      // Open add recipe modal or navigate to add recipe page
      console.log('Add recipe clicked');
    });
  }
}

function setupMealPlanEventListeners() {
  // View meal plan buttons
  document.querySelectorAll('.view-meal-plan').forEach(button => {
    button.addEventListener('click', (e) => {
      const mealPlanId = e.target.getAttribute('data-id');
      window.location.href = `meal-plan.html?id=${mealPlanId}`;
    });
  });
  
  // Edit meal plan buttons
  document.querySelectorAll('.edit-meal-plan').forEach(button => {
    button.addEventListener('click', (e) => {
      const mealPlanId = e.target.getAttribute('data-id');
      window.location.href = `meal-plan.html?id=${mealPlanId}&edit=true`;
    });
  });
  
  // Delete meal plan buttons
  document.querySelectorAll('.delete-meal-plan').forEach(button => {
    button.addEventListener('click', async (e) => {
      const mealPlanId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this meal plan?')) {
        // Note: Add delete function to supabase.js
        const { error } = await supabaseService.deleteMealPlan(mealPlanId);
        if (!error) {
          // Reload meal plans section
          const mealPlansSection = document.querySelector('.meal-plans-section');
          loadUserMealPlans(mealPlansSection);
        } else {
          console.error('Error deleting meal plan:', error);
          alert('Failed to delete meal plan. Please try again.');
        }
      }
    });
  });
  
  // Create meal plan button
  const createMealPlanButton = document.getElementById('create-meal-plan-button');
  if (createMealPlanButton) {
    createMealPlanButton.addEventListener('click', () => {
      window.location.href = 'meal-plan.html';
    });
  }
}

function setupShoppingListEventListeners() {
  // View shopping list buttons
  document.querySelectorAll('.view-shopping-list').forEach(button => {
    button.addEventListener('click', (e) => {
      const shoppingListId = e.target.getAttribute('data-id');
      // Navigate to shopping list view or open modal
      console.log('View shopping list:', shoppingListId);
    });
  });
  
  // Edit shopping list buttons
  document.querySelectorAll('.edit-shopping-list').forEach(button => {
    button.addEventListener('click', (e) => {
      const shoppingListId = e.target.getAttribute('data-id');
      // Navigate to shopping list edit page or open edit modal
      console.log('Edit shopping list:', shoppingListId);
    });
  });
  
  // Delete shopping list buttons
  document.querySelectorAll('.delete-shopping-list').forEach(button => {
    button.addEventListener('click', async (e) => {
      const shoppingListId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this shopping list?')) {
        // Note: Add delete function to supabase.js
        const { error } = await supabaseService.deleteShoppingList(shoppingListId);
        if (!error) {
          // Reload shopping lists section
          const shoppingListsSection = document.querySelector('.shopping-lists-section');
          loadUserShoppingLists(shoppingListsSection);
        } else {
          console.error('Error deleting shopping list:', error);
          alert('Failed to delete shopping list. Please try again.');
        }
      }
    });
  });
  
  // Create shopping list button
  const createShoppingListButton = document.getElementById('create-shopping-list-button');
  if (createShoppingListButton) {
    createShoppingListButton.addEventListener('click', () => {
      // Open create shopping list modal or navigate to create shopping list page
      console.log('Create shopping list clicked');
    });
  }
}

// Export functions for use in other modules
export {
  currentUser,
  isAuthenticated,
  initializeApp,
  setupEventListeners
};
