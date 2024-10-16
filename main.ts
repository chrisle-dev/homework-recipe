import {
  GetBaseUoM,
  GetProductsForIngredient,
  GetRecipes,
} from "./supporting-files/data-access";
import {
  ConvertUnits,
  GetCostPerBaseUnit,
  GetNutrientFactInBaseUnits,
} from "./supporting-files/helpers";
import { ExpectedRecipeSummary, RunTest } from "./supporting-files/testing";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
console.log("Recipe Data:", recipeData);
const recipeSummary: any = {}; // the final result to pass into the test function
/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */
// Assuming we have only one recipe to process
const recipe = recipeData[0];
const recipeName = recipe.recipeName;
let totalCost = 0;
// To hold nutrients by name
const nutrientsSummary: { [key: string]: any } = {};

// Process each line item (ingredient) in the recipe
recipe.lineItems.forEach((lineItem) => {
  // Initialize variables to find the cheapest product
  let cheapestCost = Infinity;
  let cheapestNutrientsFacts;

  const products = GetProductsForIngredient(lineItem.ingredient); // Get products for the ingredient

  // Get list suppliers of each product for ingredient
  const suppliersOfProduct = products
    .map((product) => product.supplierProducts)
    .flat();

  // Get base name and type of supplier products to convert from ingredient unit
  const { uomName, uomType } = GetBaseUoM(
    suppliersOfProduct[0].supplierProductUoM.uomType
  );

  // Convert ingredient unit to match with supplier product unit
  const convertedAmountOfIngredientToUnitOfSupply = ConvertUnits(
    lineItem.unitOfMeasure,
    uomName,
    uomType
  );

  // Iterate through each supplier product to find the cheapest one
  suppliersOfProduct.forEach((supply) => {
    const costPerBaseUnit = GetCostPerBaseUnit(supply);

    // If we found a cheaper product
    if (costPerBaseUnit < cheapestCost) {
      cheapestCost = costPerBaseUnit;
      cheapestNutrientsFacts = products.find((product) =>
        product.supplierProducts.find(
          (item) =>
            item.supplierName === supply.supplierName &&
            item.supplierProductName === supply.supplierProductName
        )
      )?.nutrientFacts;
    }
  });

  // Add the cost of the cheapest product multiplied by the amount required in the recipe
  totalCost +=
    cheapestCost * convertedAmountOfIngredientToUnitOfSupply.uomAmount;

  // Sum the nutrients from the cheapest product
  (cheapestNutrientsFacts || []).forEach((nutrient) => {
    const baseNutrientFact = GetNutrientFactInBaseUnits(nutrient);
    const nutrientName = baseNutrientFact.nutrientName;

    // Initialize nutrient summary if it doesn't exist
    if (!nutrientsSummary[nutrientName]) {
      nutrientsSummary[nutrientName] = {
        nutrientName: nutrientName,
        quantityAmount: {
          uomAmount: 0,
          uomName: baseNutrientFact.quantityAmount.uomName,
          uomType: baseNutrientFact.quantityAmount.uomType,
        },
        quantityPer: {
          uomAmount: baseNutrientFact.quantityPer.uomAmount,
          uomName: baseNutrientFact.quantityPer.uomName,
          uomType: baseNutrientFact.quantityPer.uomType,
        },
      };
    }

    // Convert and aggregate nutrient amounts based on the ingredient amount
    nutrientsSummary[nutrientName].quantityAmount.uomAmount +=
      baseNutrientFact.quantityAmount.uomAmount;
  });
});

// Construct the final recipe summary
console.log(
  "Final Result: ",
  JSON.stringify({
    cheapestCost: totalCost,
    nutrientsAtCheapestCost: nutrientsSummary,
  })
);
recipeSummary[recipeName] = {
  cheapestCost: totalCost,
  nutrientsAtCheapestCost: nutrientsSummary,
};

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);
