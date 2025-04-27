import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize the Supabase client
// Replace with your own Supabase URL and anon key
const supabaseUrl = 'https://agvvkzsakrftkrqemfop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnZrenNha3JmdGtycWVtZm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NjY4MjcsImV4cCI6MjA2MTM0MjgyN30.-d8knn3iq-IDRZvdxW9VBTf95TTLaZg5fr5M9ABakaY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication functions
async function signUp(email, password, firstName, lastName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });
  
  return { data, error };
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// Recipe functions
async function getRecipes(userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

async function getRecipe(recipeId) {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients(
        id,
        quantity,
        unit,
        notes,
        ingredients(id, name, category)
      )
    `)
    .eq('id', recipeId)
    .single();
  
  return { data, error };
}

async function createRecipe(recipeData) {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select();
  
  return { data, error };
}

async function updateRecipe(recipeId, recipeData) {
  const { data, error } = await supabase
    .from('recipes')
    .update(recipeData)
    .eq('id', recipeId)
    .select();
  
  return { data, error };
}

async function deleteRecipe(recipeId) {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId);
  
  return { error };
}

// Ingredient functions
async function getIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');
  
  return { data, error };
}

async function addRecipeIngredient(recipeIngredientData) {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .insert(recipeIngredientData)
    .select();
  
  return { data, error };
}

// Meal plan functions
async function getMealPlans(userId) {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });
  
  return { data, error };
}

async function getMealPlan(mealPlanId) {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      meal_plan_items(
        id,
        meal_date,
        meal_type,
        notes,
        recipes(id, title, preparation_time, cooking_time, servings)
      )
    `)
    .eq('id', mealPlanId)
    .single();
  
  return { data, error };
}

async function createMealPlan(mealPlanData) {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert(mealPlanData)
    .select();
  
  return { data, error };
}

async function addMealPlanItem(mealPlanItemData) {
  const { data, error } = await supabase
    .from('meal_plan_items')
    .insert(mealPlanItemData)
    .select();
  
  return { data, error };
}

// Shopping list functions
async function getShoppingLists(userId) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

async function getShoppingList(shoppingListId) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      shopping_list_items(
        id,
        quantity,
        unit,
        purchased,
        notes,
        ingredients(id, name, category)
      )
    `)
    .eq('id', shoppingListId)
    .single();
  
  return { data, error };
}

async function createShoppingList(shoppingListData) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert(shoppingListData)
    .select();
  
  return { data, error };
}

async function updateShoppingListItem(itemId, updateData) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(updateData)
    .eq('id', itemId)
    .select();
  
  return { data, error };
}

async function generateShoppingListFromMealPlan(mealPlanId, title) {
  // This would need a server-side function in Supabase to aggregate ingredients
  // For now, we'll implement this on the client side
  // This is a placeholder function
  return { error: new Error('Not implemented yet') };
}

// Test connection to Supabase
async function testConnection() {
  const { data, error } = await supabase.from('users').select('count');
  console.log('Connection test:', { data, error });
  return { data, error };
}

export default supabase;
export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getIngredients,
  addRecipeIngredient,
  getMealPlans,
  getMealPlan,
  createMealPlan,
  addMealPlanItem,
  getShoppingLists,
  getShoppingList,
  createShoppingList,
  updateShoppingListItem,
  generateShoppingListFromMealPlan,
  testConnection
};
