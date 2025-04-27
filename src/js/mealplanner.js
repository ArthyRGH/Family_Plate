import * as supabaseService from './supabase.js';
import { currentUser, isAuthenticated } from './app.js';

// Constants
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// State variables
let currentMealPlan = null;
let availableRecipes = [];
let isEditMode = false;

// Initialize the meal planner
async function initializeMealPlanner() {
  if (!isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const mealPlanId = urlParams.get('id');
  isEditMode = urlParams.get('edit') === 'true';
  
  // Get available recipes
  await loadAvailableRecipes();
  
  // Setup UI based on whether creating new or editing existing
  if (mealPlanId) {
    await loadExistingMealPlan(mealPlanId);
  } else {
    setupNewMealPlan();
  }
  
  // Setup event listeners
  setupMealPlannerEventListeners();
}

// Load available recipes
async function loadAvailableRecipes() {
  const { data, error } = await supabaseService.getRecipes(currentUser.id);
  
  if (!error && data) {
    availableRecipes = data;
  } else {
    console.error('Error loading recipes:', error);
    availableRecipes = [];
  }
}

// Load existing meal plan
async function loadExistingMealPlan(mealPlanId) {
  const loadingElement = document.createElement('div');
  loadingElement.classList.add('loading-indicator');
  loadingElement.textContent = 'Loading meal plan...';
  document.querySelector('.meal-planner-container').appendChild(loadingElement);
  
  const { data, error } = await supabaseService.getMealPlan(mealPlanId);
  
  document.querySelector('.meal-planner-container').removeChild(loadingElement);
  
  if (error) {
    showError('Error loading meal plan: ' + error.message);
    return;
  }
  
  currentMealPlan = data;
  
  // Update UI
  document.getElementById('meal-plan-title').value = currentMealPlan.title;
  document.getElementById('start-date').value = formatDateForInput(currentMealPlan.start_date);
  document.getElementById('end-date').value = formatDateForInput(currentMealPlan.end_date);
  
  // Populate meal plan grid
  renderMealPlanGrid();
  
  // Set header and button text
  document.querySelector('.section-header h2').textContent = isEditMode ? 'Edit Meal Plan' : 'View Meal Plan';
  document.getElementById('save-meal-plan').textContent = isEditMode ? 'Save Changes' : 'Save as New';
  
  // Toggle edit controls
  toggleEditControls(isEditMode);
}

// Setup a new meal plan
function setupNewMealPlan() {
  // Set default dates (current week)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate days to Monday
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  // Update UI
  document.getElementById('start-date').value = formatDateForInput(monday);
  document.getElementById('end-date').value = formatDateForInput(sunday);
  document.getElementById('meal-plan-title').value = `Meal Plan - ${formatDate(monday)} to ${formatDate(sunday)}`;
  
  // Initialize empty meal plan
  currentMealPlan = {
    title: document.getElementById('meal-plan-title').value,
    start_date: formatDateForDB(monday),
    end_date: formatDateForDB(sunday),
    user_id: currentUser.id,
    meal_plan_items: []
  };
  
  // Render empty grid
  renderMealPlanGrid();
  
  // Set header and button text
  document.querySelector('.section-header h2').textContent = 'Create New Meal Plan';
  document.getElementById('save-meal-plan').textContent = 'Create Meal Plan';
  
  // Enable edit controls
  toggleEditControls(true);
}

// Render the meal plan grid
function renderMealPlanGrid() {
  const mealPlanGrid = document.querySelector('.meal-plan-grid');
  if (!mealPlanGrid) return;
  
  // Calculate date range
  const startDate = new Date(currentMealPlan.start_date);
  const endDate = new Date(currentMealPlan.end_date);
  const numDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Create grid HTML
  let gridHTML = `
    <div class="meal-plan-header">
      <div class="day-label"></div>
      ${MEAL_TYPES.map(type => `<div class="meal-type">${capitalizeFirstLetter(type)}</div>`).join('')}
    </div>
  `;
  
  // Generate a row for each day
  for (let i = 0; i < numDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = formatDate(currentDate);
    const dayName = DAYS_OF_WEEK[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]; // Convert to Monday-Sunday format
    
    gridHTML += `
      <div class="meal-plan-row" data-date="${formatDateForDB(currentDate)}">
        <div class="day-label">
          <div class="day-name">${dayName}</div>
          <div class="day-date">${dateString}</div>
        </div>
        ${MEAL_TYPES.map(type => {
          // Find meal for this day and type
          const mealItem = currentMealPlan.meal_plan_items?.find(item => 
            new Date(item.meal_date).toDateString() === currentDate.toDateString() && 
            item.meal_type === type
          );
          
          return `
            <div class="meal-cell" data-date="${formatDateForDB(currentDate)}" data-meal-type="${type}">
              ${mealItem ? renderMealCell(mealItem) : renderEmptyCell()}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Set the grid HTML
  mealPlanGrid.innerHTML = gridHTML;
  
  // Add event listeners to cells if in edit mode
  if (isEditMode) {
    document.querySelectorAll('.meal-cell').forEach(cell => {
      cell.addEventListener('click', handleMealCellClick);
    });
  }
}

// Render a meal cell with recipe info
function renderMealCell(mealItem) {
  const recipe = mealItem.recipes;
  
  if (!recipe) {
    return `
      <div class="meal-placeholder">
        <span>${mealItem.notes || 'Custom meal'}</span>
        ${isEditMode ? '<button class="remove-meal" data-id="' + mealItem.id + '">×</button>' : ''}
      </div>
    `;
  }
  
  return `
    <div class="meal-recipe" data-recipe-id="${recipe.id}">
      <h4>${recipe.title}</h4>
      <div class="recipe-meta">
        <span>Prep: ${recipe.preparation_time || '?'} min</span>
        <span>Servings: ${recipe.servings || '?'}</span>
      </div>
      ${isEditMode ? '<button class="remove-meal" data-id="' + mealItem.id + '">×</button>' : ''}
    </div>
  `;
}

// Render an empty cell
function renderEmptyCell() {
  return isEditMode 
    ? '<div class="meal-placeholder"><span>Click to add</span></div>'
    : '<div class="meal-placeholder"><span>No meal planned</span></div>';
}

// Handle clicking on a meal cell
function handleMealCellClick(e) {
  // Don't handle if clicking the remove button
  if (e.target.classList.contains('remove-meal')) {
    handleRemoveMeal(e);
    return;
  }
  
  const cell = e.currentTarget;
  const date = cell.getAttribute('data-date');
  const mealType = cell.getAttribute('data-meal-type');
  
  // Show recipe selection modal
  showRecipeSelectionModal(date, mealType);
}

// Show recipe selection modal
function showRecipeSelectionModal(date, mealType) {
  // Create modal HTML
  const modalHTML = `
    <div class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Select Recipe for ${capitalizeFirstLetter(mealType)} on ${formatDate(new Date(date))}</h3>
          <button class="close-modal">×</button>
        </div>
        <div class="modal-body">
          ${availableRecipes.length > 0 
            ? `<div class="recipe-list">
                ${availableRecipes.map(recipe => `
                  <div class="recipe-item" data-id="${recipe.id}">
                    <h4>${recipe.title}</h4>
                    <p>${recipe.description || 'No description'}</p>
                    <div class="recipe-meta">
                      <span>Prep: ${recipe.preparation_time || '?'} min</span>
                      <span>Cook: ${recipe.cooking_time || '?'} min</span>
                      <span>Servings: ${recipe.servings || '?'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>`
            : '<div class="empty-state">You don\'t have any recipes yet. <a href="#" id="add-recipe-link">Add a recipe</a> first.</div>'
          }
          <div class="custom-meal-option">
            <h4>Or add a custom meal note</h4>
            <input type="text" id="custom-meal-note" placeholder="e.g., Eating out, Leftovers, etc.">
            <button id="add-custom-meal">Add Custom Meal</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listeners
  document.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(document.querySelector('.modal-backdrop'));
  });
  
  document.querySelectorAll('.recipe-item').forEach(item => {
    item.addEventListener('click', () => {
      const recipeId = item.getAttribute('data-id');
      addMealToPlan(date, mealType, recipeId);
      document.body.removeChild(document.querySelector('.modal-backdrop'));
    });
  });
  
  const addCustomButton = document.getElementById('add-custom-meal');
  if (addCustomButton) {
    addCustomButton.addEventListener('click', () => {
      const note = document.getElementById('custom-meal-note').value;
      if (note.trim()) {
        addCustomMealToPlan(date, mealType, note);
        document.body.removeChild(document.querySelector('.modal-backdrop'));
      }
    });
  }
  
  const addRecipeLink = document.getElementById('add-recipe-link');
  if (addRecipeLink) {
    addRecipeLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Navigate to recipe creation page or show recipe creation modal
      console.log('Add recipe clicked');
      document.body.removeChild(document.querySelector('.modal-backdrop'));
    });
  }
}

// Add a recipe meal to the plan
function addMealToPlan(date, mealType, recipeId) {
  // Find if there's already a meal item for this date and type
  const existingMealIndex = currentMealPlan.meal_plan_items?.findIndex(item => 
    item.meal_date === date && item.meal_type === mealType
  );
  
  const recipe = availableRecipes.find(r => r.id === recipeId);
  
  if (existingMealIndex !== -1 && existingMealIndex !== undefined) {
    // Update existing meal
    currentMealPlan.meal_plan_items[existingMealIndex] = {
      ...currentMealPlan.meal_plan_items[existingMealIndex],
      recipe_id: recipeId,
      notes: null
    };
  } else {
    // Add new meal
    if (!currentMealPlan.meal_plan_items) {
      currentMealPlan.meal_plan_items = [];
    }
    
    currentMealPlan.meal_plan_items.push({
      meal_plan_id: currentMealPlan.id,
      recipe_id: recipeId,
      meal_date: date,
      meal_type: mealType,
      notes: null,
      id: 'temp_' + Date.now(), // Temporary ID for UI purposes
      recipes: recipe // Add the recipe data for UI rendering
    });
  }
  
  // Update UI
  renderMealPlanGrid();
}

// Add a custom meal to the plan
function addCustomMealToPlan(date, mealType, note) {
  // Find if there's already a meal item for this date and type
  const existingMealIndex = currentMealPlan.meal_plan_items?.findIndex(item => 
    item.meal_date === date && item.meal_type === mealType
  );
  
  if (existingMealIndex !== -1 && existingMealIndex !== undefined) {
    // Update existing meal
    currentMealPlan.meal_plan_items[existingMealIndex] = {
      ...currentMealPlan.meal_plan_items[existingMealIndex],
      recipe_id: null,
      notes: note
    };
  } else {
    // Add new meal
    if (!currentMealPlan.meal_plan_items) {
      currentMealPlan.meal_plan_items = [];
    }
    
    currentMealPlan.meal_plan_items.push({
      meal_plan_id: currentMealPlan.id,
      recipe_id: null,
      meal_date: date,
      meal_type: mealType,
      notes: note,
      id: 'temp_' + Date.now() // Temporary ID for UI purposes
    });
  }
  
  // Update UI
  renderMealPlanGrid();
}

// Handle removing a meal
function handleRemoveMeal(e) {
  const button = e.target;
  const mealId = button.getAttribute('data-id');
  
  // Remove from state
  currentMealPlan.meal_plan_items = currentMealPlan.meal_plan_items.filter(item => item.id != mealId);
  
  // Update UI
  renderMealPlanGrid();
}

// Save current meal plan
async function saveMealPlan() {
  const saveButton = document.getElementById('save-meal-plan');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';
  
  // Update meal plan data from form
  currentMealPlan.title = document.getElementById('meal-plan-title').value;
  currentMealPlan.start_date = document.getElementById('start-date').value;
  currentMealPlan.end_date = document.getElementById('end-date').value;
  
  try {
    let savedMealPlan;
    let error;
    
    if (currentMealPlan.id && isEditMode) {
      // Update existing meal plan
      const result = await supabaseService.updateMealPlan(currentMealPlan.id, {
        title: currentMealPlan.title,
        start_date: currentMealPlan.start_date,
        end_date: currentMealPlan.end_date
      });
      
      error = result.error;
      savedMealPlan = result.data;
      
      // Handle meal plan items separately
      if (!error) {
        await updateMealPlanItems();
      }
    } else {
      // Create new meal plan
      const newMealPlan = {
        title: currentMealPlan.title,
        start_date: currentMealPlan.start_date,
        end_date: currentMealPlan.end_date,
        user_id: currentUser.id
      };
      
      const result = await supabaseService.createMealPlan(newMealPlan);
      error = result.error;
      savedMealPlan = result.data;
      
      // Add meal plan items if meal plan was created successfully
      if (!error && savedMealPlan) {
        const mealPlanId = savedMealPlan[0].id;
        
        for (const item of currentMealPlan.meal_plan_items || []) {
          const newItem = {
            meal_plan_id: mealPlanId,
            recipe_id: item.recipe_id,
            meal_date: item.meal_date,
            meal_type: item.meal_type,
            notes: item.notes
          };
          
          const { error: itemError } = await supabaseService.addMealPlanItem(newItem);
          
          if (itemError) {
            console.error('Error adding meal plan item:', itemError);
            // Continue with other items even if one fails
          }
        }
      }
    }
    
    if (error) {
      showError('Error saving meal plan: ' + error.message);
    } else {
      // Show success and redirect
      showSuccess('Meal plan saved successfully!');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    }
  } catch (err) {
    showError('Error saving meal plan: ' + err.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = currentMealPlan.id && isEditMode ? 'Save Changes' : 'Create Meal Plan';
  }
}

// Update meal plan items
async function updateMealPlanItems() {
  // We would need to implement proper syncing here
  // This is a simplified version that deletes existing items and adds new ones
  
  // First, we'd need a function to delete meal plan items by meal plan ID
  // This would need to be added to the supabase.js file
  // await supabaseService.deleteMealPlanItems(currentMealPlan.id);
  
  // Then add all current items
  for (const item of currentMealPlan.meal_plan_items || []) {
    // Skip items that already exist on the server (have non-temp IDs)
    if (item.id && !item.id.toString().startsWith('temp_')) {
      continue;
    }
    
    const newItem = {
      meal_plan_id: currentMealPlan.id,
      recipe_id: item.recipe_id,
      meal_date: item.meal_date,
      meal_type: item.meal_type,
      notes: item.notes
    };
    
    const { error } = await supabaseService.addMealPlanItem(newItem);
    
    if (error) {
      console.error('Error updating meal plan item:', error);
    }
  }
}

// Generate shopping list from meal plan
async function generateShoppingList() {
  const mealPlanId = currentMealPlan.id;
  
  if (!mealPlanId) {
    showError('Please save the meal plan first before generating a shopping list.');
    return;
  }
  
  const title = `Shopping List for ${currentMealPlan.title}`;
  
  const { error } = await supabaseService.generateShoppingListFromMealPlan(mealPlanId, title);
  
  if (error) {
    if (error.message === 'Not implemented yet') {
      showError('This feature is not fully implemented yet. Check back soon!');
    } else {
      showError('Error generating shopping list: ' + error.message);
    }
  } else {
    showSuccess('Shopping list generated successfully!');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  }
}

// Date utility functions
function formatDateForInput(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function formatDateForDB(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Setup event listeners for the meal planner
function setupMealPlannerEventListeners() {
  // Save button
  const saveButton = document.getElementById('save-meal-plan');
  if (saveButton) {
    saveButton.addEventListener('click', saveMealPlan);
  }
  
  // Generate shopping list button
  const generateButton = document.getElementById('generate-shopping-list');
  if (generateButton) {
    generateButton.addEventListener('click', generateShoppingList);
  }
  
  // Date change event
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  
  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', () => {
      // Ensure end date is at least the same as start date
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      
      if (endDate < startDate) {
        endDateInput.value = startDateInput.value;
      }
      
      // Update UI
      renderMealPlanGrid();
    });
    
    endDateInput.addEventListener('change', () => {
      // Ensure start date is at most the same as end date
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      
      if (startDate > endDate) {
        startDateInput.value = endDateInput.value;
      }
      
      // Update UI
      renderMealPlanGrid();
    });
  }
  
  // Cancel button
  const cancelButton = document.getElementById('cancel-meal-plan');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        window.location.href = 'dashboard.html';
      }
    });
  }
}

// Toggle edit controls based on edit mode
function toggleEditControls(enabled) {
  const controls = document.querySelectorAll('.edit-control');
  controls.forEach(control => {
    control.disabled = !enabled;
  });
  
  // Add or remove editable class from meal cells
  const cells = document.querySelectorAll('.meal-cell');
  cells.forEach(cell => {
    if (enabled) {
      cell.classList.add('editable');
    } else {
      cell.classList.remove('editable');
    }
  });
}

// Show error message
function showError(message) {
  const messageContainer = document.querySelector('.message-container');
  if (messageContainer) {
    messageContainer.innerHTML = `<div class="error-message">${message}</div>`;
    
    // Clear after 5 seconds
    setTimeout(() => {
      messageContainer.innerHTML = '';
    }, 5000);
  }
}

// Show success message
function showSuccess(message) {
  const messageContainer = document.querySelector('.message-container');
  if (messageContainer) {
    messageContainer.innerHTML = `<div class="success-message">${message}</div>`;
    
    // Clear after 5 seconds
    setTimeout(() => {
      messageContainer.innerHTML = '';
    }, 5000);
  }
}

// Utility function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export {
  initializeMealPlanner,
  loadExistingMealPlan,
  saveMealPlan,
  generateShoppingList
};
