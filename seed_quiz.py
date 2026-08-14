import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def seed_quiz():
    client = AsyncIOMotorClient('mongodb+srv://rushalbangar19_db_user:Morya123@shikshamitr.ooe5ymf.mongodb.net/?retryWrites=true&w=majority')
    db = client.shikshamitr

    sample_quiz = {
        "title": "Class 10 Science - Chemical Reactions & Equations",
        "standard": 10,
        "subject": "Science",
        "questions": [
            {
                "question": "What is the chemical formula of Rust?",
                "options": ["Fe2O3.xH2O", "Fe3O4", "FeO", "Fe(OH)3"],
                "correct_option": 0,
                "explanation": "Rust is hydrated iron(III) oxide with chemical formula Fe2O3.xH2O."
            },
            {
                "question": "Which of the following is an exothermic reaction?",
                "options": ["Photosynthesis", "Respiration", "Melting of ice", "Evaporation of water"],
                "correct_option": 1,
                "explanation": "Respiration releases energy in the form of ATP and heat, making it an exothermic reaction."
            },
            {
                "question": "The substance which is reduced in a chemical reaction acts as a:",
                "options": ["Reducing agent", "Oxidizing agent", "Catalyst", "Inhibitor"],
                "correct_option": 1,
                "explanation": "The substance which undergoes reduction oxidizes the other substance, hence it acts as an Oxidizing Agent."
            }
        ]
    }

    res = await db.quizzes.update_one(
        {"title": sample_quiz["title"]},
        {"$set": sample_quiz},
        upsert=True
    )
    print("Sample quiz seeded successfully:", res.upserted_id or "Updated")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_quiz())
