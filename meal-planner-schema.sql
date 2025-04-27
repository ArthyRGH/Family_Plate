-- Family Meal Planner Database Schema
-- This script creates all required tables for the meal planner application

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  preparation_time INTEGER, -- in minutes
  cooking_time INTEGER, -- in minutes
  servings INTEGER,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients Table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50)
);

-- Recipe Ingredients Junction Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2),
  unit VARCHAR(30),
  notes TEXT
);

-- Meal Plans Table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal Plan Items Table
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  meal_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack
  notes TEXT
);

-- Shopping Lists Table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping List Items Table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2),
  unit VARCHAR(30),
  purchased BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert some sample ingredients
INSERT INTO ingredients (name, category) VALUES
('Chicken Breast', 'Meat'),
('Ground Beef', 'Meat'),
('Salmon Fillet', 'Seafood'),
('Rice', 'Grains'),
('Pasta', 'Grains'),
('Quinoa', 'Grains'),
('Tomato', 'Vegetables'),
('Onion', 'Vegetables'),
('Garlic', 'Vegetables'),
('Spinach', 'Vegetables'),
('Broccoli', 'Vegetables'),
('Bell Pepper', 'Vegetables'),
('Carrot', 'Vegetables'),
('Potato', 'Vegetables'),
('Olive Oil', 'Oils'),
('Salt', 'Spices'),
('Black Pepper', 'Spices'),
('Oregano', 'Herbs'),
('Basil', 'Herbs'),
('Milk', 'Dairy'),
('Cheese', 'Dairy'),
('Eggs', 'Dairy'),
('Butter', 'Dairy'),
('Flour', 'Baking'),
('Sugar', 'Baking'),
('Lemon', 'Fruits'),
('Apple', 'Fruits'),
('Banana', 'Fruits'),
('Berries', 'Fruits'); 