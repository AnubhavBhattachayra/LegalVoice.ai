import asyncio
import sys
import os
from datetime import datetime
from dotenv import load_dotenv
import motor.motor_asyncio
import pathlib

# Get the current directory and project root
current_dir = pathlib.Path(__file__).parent.absolute()
project_root = current_dir.parent

# Load environment variables from .env.local
env_path = project_root / '.env.local'
load_dotenv(dotenv_path=env_path)

# Print environment loading status
print(f"Loading environment from: {env_path}")

# Database connection
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "legalvoice")

# Print database connection info (without credentials)
if MONGODB_URI:
    # Mask the password in the URI for logging
    masked_uri = MONGODB_URI
    if "@" in MONGODB_URI:
        prefix = MONGODB_URI.split("@")[0]
        suffix = MONGODB_URI.split("@")[1]
        # Replace password with ***
        if ":" in prefix:
            user = prefix.split(":")[0]
            masked_uri = f"{user}:***@{suffix}"
    print(f"Using MongoDB URI: {masked_uri}")
    print(f"Using database: {DATABASE_NAME}")
else:
    print("MONGODB_URI environment variable not set")

# Patent guidelines data with improved content
PATENT_GUIDELINES = [
    # Title section
    {
        "section": "title",
        "title": "Effective Patent Titles",
        "content": "A patent title should be concise yet descriptive of the invention. Avoid marketing terms or superlatives (like 'improved', 'novel', etc.). Focus on the technical subject matter. Aim for 5-15 words that would help a patent examiner categorize your invention properly.\n\nExamples:\n- \"Method for Secure Electronic Transactions\"\n- \"Apparatus for Purifying Water Using Solar Energy\"\n- \"Composition for Treating Diabetes\"",
        "order": 1
    },
    {
        "section": "title",
        "title": "Title Formatting Guidelines",
        "content": "Follow these formatting guidelines for patent titles:\n\n1. Capitalize the first letter of each significant word\n2. Do not end with a period\n3. Avoid abbreviations unless they are more widely recognized than the full term\n4. Do not use person names or trademarks\n5. Titles may include the words \"method,\" \"system,\" \"device,\" \"apparatus,\" or similar terms to indicate the category of invention",
        "order": 2
    },
    
    # Field section
    {
        "section": "field",
        "title": "Defining the Field of Invention",
        "content": "The Field of Invention section should identify the general technical field or industry to which your invention pertains. It provides context for the patent examiner and readers. Keep it brief (1-3 sentences) and factual.\n\nTry using phrases such as:\n- \"The present invention relates to the field of...\"\n- \"This invention pertains to...\"\n- \"The technical field of the invention is...\"",
        "order": 1
    },
    {
        "section": "field",
        "title": "Field Section Examples",
        "content": "Example 1 (Medical Device):\n\"The present invention relates to medical devices, specifically to implantable cardiovascular devices for monitoring heart function.\"\n\nExample 2 (Software):\n\"The present invention pertains to computer-implemented methods and systems for secure data transmission over networks, particularly for financial transactions.\"\n\nExample 3 (Chemical Composition):\n\"This invention relates to the field of biodegradable polymers, specifically to compositions suitable for use in agricultural applications.\"",
        "order": 2
    },
    
    # Background section
    {
        "section": "background",
        "title": "Crafting an Effective Background",
        "content": "The Background section should describe the state of the art before your invention and identify problems or limitations with existing technologies. This sets the stage for why your invention is needed. Be objective and factual when describing prior art.\n\nStructure your background with:\n1. Overview of the technical field\n2. Description of existing approaches\n3. Problems or limitations with current solutions\n4. Need for improvement (without describing your solution yet)",
        "order": 1
    },
    {
        "section": "background",
        "title": "Background Section Strategies",
        "content": "When writing your background section:\n\n- Focus on technical rather than business problems\n- Cite specific prior art if known, including patents and publications\n- Be careful not to unnecessarily narrow the scope of your invention\n- Avoid disparaging language about competitors' products\n- Don't include too much detail about your own invention (save this for the summary and detailed description)\n- Consider a chronological approach describing how the field has evolved",
        "order": 2
    },
    {
        "section": "background",
        "title": "Background Legal Considerations",
        "content": "Be aware of these legal considerations when drafting the background section:\n\n1. Admissions: Statements about prior art may be treated as admissions that can be used against your patent\n\n2. Limiting the invention: Describing problems too narrowly may limit the scope of your claims\n\n3. Written description: Ensure consistency between problems identified and solutions described\n\n4. Enablement: Technical details in the background should be accurate\n\nConsult with a patent attorney to review this section carefully.",
        "order": 3
    },
    
    # Objects section
    {
        "section": "objects",
        "title": "Purpose of the Objects Section",
        "content": "The Objects section states the goals, aims, and objectives your invention addresses. It bridges the Background (problems) to your inventive solution. Present your objectives clearly and technically.\n\nTypically this section begins with phrases like:\n- \"It is an object of the present invention to provide...\"\n- \"A primary objective of the invention is...\"\n- \"The invention aims to overcome...\"",
        "order": 1
    },
    {
        "section": "objects",
        "title": "Objects Section Formatting",
        "content": "The Objects section is typically formatted as a list of discrete objectives. Each objective should address a specific technical problem or limitation identified in the Background.\n\nExample format:\n\n\"It is an object of the present invention to provide a system for secure data transmission that prevents unauthorized access.\"\n\n\"Another object is to reduce computational overhead in encryption processes.\"\n\n\"A further object is to ensure compatibility with existing network infrastructures.\"",
        "order": 2
    },
    
    # Summary section
    {
        "section": "summary",
        "title": "Summary Section Overview",
        "content": "The Summary of the Invention provides a concise overview of your invention's key aspects. It should describe the invention broadly yet accurately, highlighting its novel features and advantages. This section often parallels your independent claims.\n\nInclude:\n1. The general nature and core components of the invention\n2. How these components interact\n3. The principal novel features\n4. Key advantages or improvements over prior art",
        "order": 1
    },
    {
        "section": "summary",
        "title": "Summary Writing Strategies",
        "content": "When drafting your Summary section:\n\n- Begin with a broad statement: \"In one aspect, the invention provides...\"\n- Use the phrase \"in accordance with the present invention\" to describe key elements\n- Include alternative embodiments with phrases like \"in another embodiment...\"\n- Ensure all claimed elements are described\n- Avoid limiting language unless intentional\n- Mention key advantages without overstating them\n- Cross-reference to figures where appropriate",
        "order": 2
    },
    
    # Drawings section
    {
        "section": "drawings",
        "title": "Brief Description of Drawings",
        "content": "The Brief Description of Drawings section provides a concise explanation of what each figure in your patent application illustrates. This section should be simple and straightforward, without detailed explanations (those go in the Detailed Description).\n\nFor each figure, provide a single sentence describing what the drawing shows. Examples:\n\n\"FIG. 1 is a perspective view of the device according to one embodiment.\"\n\n\"FIG. 2 is a flowchart illustrating the steps of the method according to the invention.\"\n\n\"FIG. 3 is a schematic diagram showing the internal components of the system.\"",
        "order": 1
    },
    {
        "section": "drawings",
        "title": "Drawing Requirements",
        "content": "Patent drawings must meet specific requirements:\n\n1. Drawing Types: Include enough views (perspective, exploded, sectional, flowcharts, etc.) to show all aspects of the invention\n\n2. Numbering: Number figures consecutively (FIG. 1, FIG. 2, etc.)\n\n3. Reference Characters: Use consistent numbering for components across all figures (e.g., if a valve is \"23\" in FIG. 1, it should be \"23\" in all other figures)\n\n4. Drawing Quality: Drawings must have clean lines and sufficient detail to illustrate the invention clearly\n\n5. No Text: Minimize text in drawings except for reference numbers and basic labels",
        "order": 2
    },
    
    # Detailed section
    {
        "section": "detailed",
        "title": "Detailed Description Purpose",
        "content": "The Detailed Description is the heart of your patent application. It must provide a complete explanation of how to make and use the invention in sufficient detail that a person skilled in the field could reproduce it without undue experimentation.\n\nThis section should:\n1. Describe all embodiments claimed in your application\n2. Explain how the invention works in practice\n3. Cover potential variations and alternatives\n4. Reference the drawings to clarify the explanation\n5. Provide specific examples where applicable",
        "order": 1
    },
    {
        "section": "detailed",
        "title": "Detailed Description Structure",
        "content": "Structure your Detailed Description logically:\n\n1. Start with an overview of the invention's components and operation\n\n2. Describe the preferred embodiment in detail, referring to drawings using reference numbers\n\n3. Explain how the invention is made or implemented\n\n4. Describe how the invention functions or operates\n\n5. Include alternative embodiments and variations\n\n6. Provide specific examples or use cases\n\n7. End with a statement indicating that the described embodiments are exemplary",
        "order": 2
    },
    {
        "section": "detailed",
        "title": "Legal Considerations for Detailed Description",
        "content": "The Detailed Description is particularly important for legal reasons:\n\n1. Enablement: It must enable someone skilled in the art to make and use the invention without undue experimentation\n\n2. Written Description: It must demonstrate that you were in possession of the full scope of the claimed invention\n\n3. Best Mode: You must disclose the best mode contemplated for carrying out the invention\n\n4. Claim Support: All claim elements must be supported in the detailed description\n\n5. Breadth: Include variations and alternatives to support broader claim interpretation",
        "order": 3
    },
    
    # Claims section
    {
        "section": "claims",
        "title": "Claims Fundamentals",
        "content": "Claims define the legal scope of your patent protection. They consist of numbered paragraphs at the end of the patent, each defining a specific invention or aspect of your invention.\n\nClaims are divided into:\n\n1. Independent claims - Stand alone and don't refer to other claims\n2. Dependent claims - Reference another claim and add further limitations\n\nEach claim is a single sentence beginning with \"A method for...\" or \"An apparatus comprising...\" followed by the elements of the invention.",
        "order": 1
    },
    {
        "section": "claims",
        "title": "Independent Claim Structure",
        "content": "An independent claim typically follows this structure:\n\n1. Preamble: Identifies the category of invention (method, apparatus, system, etc.)\n   Example: \"A method for purifying water...\"\n\n2. Transition: Typically \"comprising\" (meaning \"including but not limited to\")\n   Example: \"...comprising:\"\n\n3. Body: Lists the essential elements of the invention\n   Example: \"providing a filtration membrane;\napplying pressure to force water through the membrane;\ncollecting the filtered water.\"\n\nThe entire claim is a single sentence with the elements separated by semicolons.",
        "order": 2
    },
    {
        "section": "claims",
        "title": "Dependent Claim Structure",
        "content": "Dependent claims add further limitations to an independent or another dependent claim. They provide fallback positions if the broader claims are invalidated.\n\nFormat:\n\"The [invention] of claim [X], wherein [additional limitation].\"\n\nExamples:\n\"The method of claim 1, wherein the filtration membrane comprises carbon nanotubes.\"\n\n\"The apparatus of claim 5, wherein the controller is programmed to adjust the temperature based on humidity readings.\"\n\nDraft multiple dependent claims to cover various aspects and embodiments of your invention.",
        "order": 3
    },
    
    # Abstract section
    {
        "section": "abstract",
        "title": "Abstract Requirements",
        "content": "The Abstract is a brief summary (usually 150 words or less) of your invention's technical disclosure. It appears on the front page of the published patent.\n\nThe Abstract should:\n1. Identify the technical field of the invention\n2. Summarize the technical problem addressed\n3. Highlight the essence of the solution\n4. Mention principal uses of the invention\n5. Be written in clear, concise language\n\nAvoid legal phraseology used in the claims. The abstract is for technical information only, not legal definition.",
        "order": 1
    },
    {
        "section": "abstract",
        "title": "Abstract Examples and Format",
        "content": "Example Abstract (Medical Device):\n\"A catheter for delivering therapeutic agents to vascular tissue includes an elongate body, an expandable portion at the distal end, and multiple microneedle projections on the expandable portion. The microneedles are configured to penetrate vascular tissue to a controlled depth when the expandable portion is expanded against a vessel wall. A delivery lumen communicates with the microneedles to deliver therapeutic agents directly into tissue. The device enables targeted delivery of medications to specific vascular regions while minimizing systemic exposure.\"\n\nFormat the abstract as a single paragraph without paragraph breaks. Begin with the broadest statement about your invention, then add more specific details.",
        "order": 2
    }
]

async def init_database():
    """Initialize the database with patent guidelines."""
    try:
        # Connect to MongoDB
        if not MONGODB_URI:
            print("Error: MONGODB_URI environment variable not set")
            return False
            
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        # Verify connection
        try:
            # The ismaster command is cheap and does not require auth
            await client.admin.command('ismaster')
            print(f"Successfully connected to MongoDB at {MONGODB_URI}")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            return False
            
        # Initialize patent guidelines collection
        guidelines_collection = db.patent_guidelines
        
        # Check if collection already has data
        count = await guidelines_collection.count_documents({})
        if count > 0:
            print(f"Patent guidelines collection already contains {count} documents. Skipping initialization.")
        else:
            # Add created_at and updated_at timestamps
            for guideline in PATENT_GUIDELINES:
                guideline['created_at'] = datetime.utcnow()
                guideline['updated_at'] = datetime.utcnow()
                
            # Insert guidelines
            result = await guidelines_collection.insert_many(PATENT_GUIDELINES)
            print(f"Successfully inserted {len(result.inserted_ids)} patent guidelines")
        
        return True
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False
        
if __name__ == "__main__":
    try:
        # Run the initialization function
        success = asyncio.run(init_database())
        
        if success:
            print("Database initialization completed successfully")
            sys.exit(0)
        else:
            print("Database initialization failed")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nInitialization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error during initialization: {e}")
        sys.exit(1) 