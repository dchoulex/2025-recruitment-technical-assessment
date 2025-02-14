const request = require("supertest");

describe("Task 1", () => {
  describe("POST /parse", () => {
    const getTask1 = async (inputStr) => {
      return await request("http://localhost:8080")
        .post("/parse")
        .send({ input: inputStr });
    };

    it("example1", async () => {
      const response = await getTask1("Riz@z RISO00tto!");
      expect(response.body).toStrictEqual({ msg: "Rizz Risotto" });
    });

    it("example2", async () => {
      const response = await getTask1("alpHa-alFRedo");
      expect(response.body).toStrictEqual({ msg: "Alpha Alfredo" });
    });

    // Additional test case. Trailing with special characters.
    it("trailing whitespace", async () => {
      const response = await getTask1("kAisenDon-----");
      expect(response.body).toStrictEqual({ msg: "Kaisendon" });
    });

    // Additional test case. The word starts with special character
    it("leading whitespace", async () => {
      const response = await getTask1("----yummy-wagyu");
      expect(response.body).toStrictEqual({ msg: "Yummy Wagyu" });
    });

    it("error case", async () => {
      const response = await getTask1("");
      expect(response.status).toBe(400);
    });

    // Additional test case. When all characters are non letters. 
    it("error case 2", async () => {
      const response = await getTask1("@@@1122334");
      expect(response.status).toBe(400);
    });

    // Additional test case. All letters are whitespaces. 
    it("error case 3", async () => {
      const response = await getTask1("     ");
      console.log(response.error)
      expect(response.status).toBe(400);
    });
  });
});

describe("Task 2", () => {
  describe("POST /entry", () => {
    const putTask2 = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    it("Add Ingredients", async () => {
      const entries = [
        { type: "ingredient", name: "Egg", cookTime: 6 },
        { type: "ingredient", name: "Lettuce", cookTime: 1 },
      ];
      for (const entry of entries) {
        const resp = await putTask2(entry);
        expect(resp.status).toBe(200);
        expect(resp.body).toStrictEqual({});
      }
    });

    it("Add Recipe", async () => {
      const meatball = {
        type: "recipe",
        name: "Meatball",
        requiredItems: [{ name: "Beef", quantity: 1 }],
      };
      const resp1 = await putTask2(meatball);
      expect(resp1.status).toBe(200);
    });

    // Additional test case. Add recipe with empty list of required items, assume as non vaild data.
    it("Add Recipe with no required items.", async () => {
      const friedRice = {
        type: "recipe",
        name: "Fried rice",
        requiredItems: [],
      };
      const resp1 = await putTask2(friedRice);
      expect(resp1.status).toBe(400);
    });

    it("Congratulations u burnt the pan pt2", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "beef",
        cookTime: -1,
      });
      expect(resp.status).toBe(400);
    });

    it("Congratulations u burnt the pan pt3", async () => {
      const resp = await putTask2({
        type: "pan",
        name: "pan",
        cookTime: 20,
      });
      expect(resp.status).toBe(400);
    });

    it("Unique names", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 10,
      });
      expect(resp.status).toBe(200);

      const resp2 = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp2.status).toBe(400);

      const resp3 = await putTask2({
        type: "recipe",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp3.status).toBe(400);
    });

    // Additional test case. Check duplicate required items.
    it("Duplicate required elements.", async () => {
      const resp = await putTask2({
        type: "recipe",
        name: "Yakiniku",
        requiredItems: [
          { name: "Beef", quantity: 1 },
          { name: "Beef", quantity: 1 },
        ],
      });
      expect(resp.status).toBe(400);
    });

    // Additional test case. Recipe data entry in wrong format.
    it("Wrong recipe data format.", async () => {
      const resp = await putTask2({
        type: "recipe",
        name: "Tempura",
        cookTime: 10,
      });

      expect(resp.status).toBe(400);
    });

    // Additional test case. Ingredient data entry in wrong format.
    it("Wrong ingredient data format.", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "Taiyaki",
        requiredItems: [
          { name: 'Azuki', quantity: 1}
        ],
      });

      expect(resp.status).toBe(400);
    });

    // Additional test case. Recipe data entry requiredItems field has non valid quantity.
    it("Wrong quantity format in the required items part 1.", async () => {
      const resp = await putTask2({
        type: "recipe",
        name: "Daifuku",
        requiredItems: [
          { name: 'Mochi', quantity: -10}
        ],
      });

      expect(resp.status).toBe(400);
    });

    // Additional test case. Recipe data entry requiredItems field has non valid quantity.
    it("Wrong quantity format in the required items part 2.", async () => {
      const resp = await putTask2({
        type: "recipe",
        name: "Daifuku",
        requiredItems: [
          { name: 'Kinoko', quantity: 0}
        ],
      });

      expect(resp.status).toBe(400);
    });

  });
});

describe("Task 3", () => {
  describe("GET /summary", () => {
    const postEntry = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    const getTask3 = async (name) => {
      return await request("http://localhost:8080").get(
        `/summary?name=${name}`
      );
    };

    it("What is bro doing - Get empty cookbook", async () => {
      const resp = await getTask3("nothing");
      expect(resp.status).toBe(400);
    });

    it("What is bro doing - Get ingredient", async () => {
      const resp = await postEntry({
        type: "ingredient",
        name: "beef",
        cookTime: 2,
      });
      expect(resp.status).toBe(200);

      const resp2 = await getTask3("beef");
      expect(resp2.status).toBe(400);
    });

    it("Unknown missing item", async () => {
      const cheese = {
        type: "recipe",
        name: "Cheese",
        requiredItems: [{ name: "Not Real", quantity: 1 }],
      };
      const resp1 = await postEntry(cheese);
      expect(resp1.status).toBe(200);

      const resp2 = await getTask3("Cheese");
      expect(resp2.status).toBe(400);
    });

    it("Bro cooked", async () => {
      const meatball = {
        type: "recipe",
        name: "Skibidi",
        requiredItems: [{ name: "Bruh", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "ingredient",
        name: "Bruh",
        cookTime: 2,
      });
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Skibidi");
      // console.log(resp3.error);
      expect(resp3.status).toBe(200);
    });

    // Additional test case. There is a loop in the recipe.
    it("Recipe is in loop.", async () => {
      const aburaSoba = {
        type: "recipe",
        name: "Abura Soba",
        requiredItems: [{ name: "Soba", quantity: 1 }],
      };
      const resp1 = await postEntry(aburaSoba);
      expect(resp1.status).toBe(200);

      const soba = {
        type: "recipe",
        name: "Soba",
        requiredItems: [{ name: "Abura Soba", quantity: 2 }],
      };
      const resp2 = await postEntry(soba);
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Abura Soba");
      // console.log(resp3.error);
      expect(resp3.status).toBe(400);

      const resp4 = await getTask3("Soba");
      // console.log(resp4.error);
      expect(resp4.status).toBe(400);
    });

    // Additional test case. There is a loop in the recipe.
    // it("Bro is a pro now.", async () => {
    //   const spaghetti = {
    //     type: "recipe",
    //     name: "Skibidi Spaghetti",
    //     requiredItems: [
    //       { name: "Oishi Meatball", quantity: 3 },
    //       { name: "Pasta", quantity: 1 },
    //       { name: "Tomato", quantity: 2 },
    //     ],
    //   };
    //   const resp1 = await postEntry(spaghetti);
    //   expect(resp1.status).toBe(200);

    //   const meatball = {
    //     type: "recipe",
    //     name: "Oishi Meatball",
    //     requiredItems: [
    //       { name: "Beef", quantity: 2 },
    //       { name: "Pasta", quantity: 1 },
    //       { name: "Egg", quantity: 1 },
    //     ],
    //   };
    //   const resp2 = await postEntry(meatball);
    //   // console.log(resp2.error);
    //   expect(resp2.status).toBe(200);

    //   const pasta = {
    //     type: "recipe",
    //     name: "Pasta",
    //     requiredItems: [
    //       { name: "Flour", quantity: 3 },
    //       { name: "Egg", quantity: 1 },
    //     ],
    //   };
    //   const resp3 = await postEntry(pasta);
    //   expect(resp3.status).toBe(200);

    //   const entries = [
    //     { type: "ingredient", name: "Beef", cookTime: 5 },
    //     { type: "ingredient", name: "Egg", cookTime: 3 },
    //     { type: "ingredient", name: "Flour", cookTime: 0 },
    //     { type: "ingredient", name: "Tomato", cookTime: 2 },
    //   ];

    //   for (const entry of entries) {
    //     const resp4 = await postEntry(entry);
    //     expect(resp4.status).toBe(200);
    //   }

    //   const resp5 = await getTask3("Skibidi Spaghetti");
    //   // console.log(resp5.body);
    //   expect(resp5.status).toBe(200);
    // });

    it("Bro is on fire!", async () => {
      const dish1 = {
        type: "recipe",
        name: "Dish1",
        requiredItems: [
          { name: "Dish2", quantity: 3 },
          { name: "Dish3", quantity: 2 },
          { name: "Dish4", quantity: 2 },
          { name: "Ing1", quantity: 1 },
        ],
      };
      const resp1 = await postEntry(dish1);
      expect(resp1.status).toBe(200);

      const dish2 = {
        type: "recipe",
        name: "Dish2",
        requiredItems: [
          { name: "Dish3", quantity: 3 },
          { name: "Dish4", quantity: 2 },
          { name: "Ing2", quantity: 2 },
        ],
      };

      const resp2 = await postEntry(dish2);
      expect(resp2.status).toBe(200);

      const dish3 = {
        type: "recipe",
        name: "Dish3",
        requiredItems: [
          { name: "Dish4", quantity: 1 },
          { name: "Ing3", quantity: 2 },
        ],
      };

      const resp3 = await postEntry(dish3);
      expect(resp3.status).toBe(200);

      const dish4 = {
        type: "recipe",
        name: "Dish4",
        requiredItems: [
          { name: "Ing1", quantity: 2 },
          { name: "Ing2", quantity: 2 },
        ],
      };

      const resp4 = await postEntry(dish4);
      expect(resp4.status).toBe(200);

      const entries = [
        { type: "ingredient", name: "Ing1", cookTime: 5 },
        { type: "ingredient", name: "Ing2", cookTime: 3 },
        { type: "ingredient", name: "Ing3", cookTime: 0 },
      ];

      for (const entry of entries) {
        const resp5 = await postEntry(entry);
        expect(resp5.status).toBe(200);
      }

      const resp6 = await getTask3("Dish1");
      console.log(resp6.body);
      expect(resp6.status).toBe(200);
    });
  });
});
