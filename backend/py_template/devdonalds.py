from dataclasses import dataclass
from typing import List, Dict, Union, Set
from flask import Flask, request, jsonify
import re
import sys

# Max number of entries in cookbook is below 10_000. Default python recursion limit is 1_000. 
# Change the recursion limit to 10_000.
sys.setrecursionlimit(10 ** 4)

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]
	items: Set[str]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int

@dataclass
class IngredientSummary():
	name: str
	quantity: int

@dataclass
class RecipeSummary():
	name: str
	cook_time: int
	ingredients: Dict[str, IngredientSummary]

# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
# Initiate cookbook as hash map to identify unique name efficiently.
cookbook = {}

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str | None]:
	# TODO: implement me
	if len(recipeName) == 0:
		return None
	
	parsed_name = recipeName

	# To improve readability, divide the parsing logic step by step.
	# Remove all '-' and '_'.
	parsed_name = parsed_name.replace('-', ' ').replace('_', ' ')

	# Remove all non letter characters.
	parsed_name = re.sub(r'[^a-zA-Z ]', '', parsed_name)

	# Capitalize the first letter of each word.
	parsed_name = parsed_name.lower().title()

	# Remove leading and trailing whitespaces.
	parsed_name = parsed_name.strip()

	# Squash down multiple whitespaces to a singular whitespace.
	parsed_name = re.sub(r' {2,}', ' ', parsed_name)

	# Return recipe name if length is > 0 and None otherwise
	return parsed_name if len(parsed_name) > 0 else None

# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	# TODO: implement me
	name = request.json.get('name', None)
	entry_type = request.json.get('type', None)

	if name is None:
		return 'Invalid name.', 400
	
	# Return 400 when entry name already exist. Assume the entry name can only belong to either 'ingredient' or 'recipe' type, not both.
	if name in cookbook:
		return 'Data entry already exist.', 400
	
	# Return 400 when the entry type is not recipe or ingredient.
	if entry_type is None or entry_type not in {'recipe', 'ingredient'}:
		return 'Invalid type.', 400
	
	if entry_type == 'recipe':
		required_items = request.json.get('requiredItems', None)

		# Optional edge case. if the recipe doesn't have required items.
		if required_items is None or len(required_items) == 0:
			return 'Invalid required items.', 400
		
		recipe = Recipe(name, [], set())
		
		for item in required_items:
			item_name, quantity = item.values()

			# Assume quantity below or equal to 0 is invalid.
			if int(quantity) <= 0:
				return 'Quantity is not valid', 400

			# Return 400 when duplicate item exist.
			if item_name in recipe.items:
				return 'Duplicate required item found.', 400
			
			recipe.items.add(item_name)
			required_item = RequiredItem(item_name, quantity)

			recipe.required_items.append(required_item)

		cookbook[name] = recipe
		
	elif entry_type == 'ingredient':
		cook_time = request.json.get('cookTime', None)

		# Return 400 when cook time is smaller than 0
		if cook_time is None or int(cook_time) < 0:
			return 'Invalid cook time.', 400
		
		cookbook[name] = Ingredient(name, cook_time)

	return ' ', 200

# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name

def get_recipe_summary(item_name, cache, visited):
	if item_name not in cookbook:
		return None

	if item_name in cache:
		print('Hit cache!')
		return cache[item_name]
	
	item = cookbook[item_name]
	
	if type(item) == Ingredient:
		return item
	
	# Detect cycle
	if item.name in visited:
		return None
	
	visited.add(item.name)

	required_items = item.required_items

	# Optional edge case. if the recipe doesn't have required items.
	if required_items is None or len(required_items) == 0:
		return None
	
	recipe_summary = RecipeSummary(item.name, 0, {})
	
	for required_item in required_items:
		summary = get_recipe_summary(required_item.name, cache, visited)

		if summary is None:
			return None
		
		# Summary is an instance of Ingredient
		if type(summary) == Ingredient:
			ingredient_name = summary.name

			if ingredient_name in recipe_summary.ingredients:
				existing_ingredient = recipe_summary.ingredients[ingredient_name]
				recipe_summary.ingredients[ingredient_name] = IngredientSummary(ingredient_name, existing_ingredient.quantity + required_item.quantity)
			else:
				recipe_summary.ingredients[ingredient_name] = IngredientSummary(ingredient_name, required_item.quantity)
				
		# Summary is an instance of RecipeSummary
		else:
			for ingredient_name in summary.ingredients:
				additional_ingredient = summary.ingredients[ingredient_name]

				if ingredient_name in recipe_summary.ingredients:
					existing_ingredient = recipe_summary.ingredients[ingredient_name]
					recipe_summary.ingredients[ingredient_name] = IngredientSummary(ingredient_name, existing_ingredient.quantity + (additional_ingredient.quantity * required_item.quantity))
				else:
					recipe_summary.ingredients[ingredient_name] = IngredientSummary(ingredient_name, additional_ingredient.quantity * required_item.quantity)

		recipe_summary.cook_time += summary.cook_time * required_item.quantity

		cache[item.name] = recipe_summary		

	return recipe_summary

@app.route('/summary', methods=['GET'])
def summary():
	# TODO: implement me
	# Assume the recipe name always valid
	recipe_name = request.args.get('name', None)

	# Return 400 if the recipe name cannot be found and the type is ingredient.
	if recipe_name is None or recipe_name not in cookbook or type(cookbook[recipe_name]) != Recipe:
		return 'Invalid recipe name', 400
	
	cache = {}
	visited = set()
	recipe_summary = get_recipe_summary(recipe_name, cache, visited)

	if recipe_summary is None:
		return 'Recipe contains ingredients or recipes that does not exist or recipe is in loop.', 400

	response_body = {
		'name': recipe_summary.name,
		'cookTime': recipe_summary.cook_time,
		'ingredients': [{'name': ingredient_summary.name, 'quantity': ingredient_summary.quantity} for ingredient_summary in recipe_summary.ingredients.values()]
	}

	return response_body, 200


# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
