#!/usr/bin/env python3
"""
Seed script to create GridTech Industries demo company with comprehensive data.
Includes: Company, Admin User, Sites, Assets, Substations, Equipment, Cross-Module Links, Test Records
"""

import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import random

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'dms_insight')

# Company Details
COMPANY_ID = "COMP-GRIDTECH"
COMPANY_NAME = "GridTech Industries"
COMPANY_CODE = "GTI"

# Admin User Details
ADMIN_USERNAME = "GridTechAdmin"
ADMIN_PASSWORD = "Test@123"
ADMIN_EMAIL = "admin@gridtech-industries.com"
ADMIN_FULL_NAME = "Michael Thompson"

# Region Configuration
REGIONS = {
    "central": {
        "name": "Central Region",
        "substations": 6,
        "cities": ["Riyadh", "Al-Kharj", "Majmaah"]
    },
    "eastern": {
        "name": "Eastern Region", 
        "substations": 5,
        "cities": ["Dammam", "Dhahran", "Al-Khobar", "Jubail"]
    },
    "western": {
        "name": "Western Region",
        "substations": 5,
        "cities": ["Jeddah", "Mecca", "Taif"]
    },
    "southern": {
        "name": "Southern Region",
        "substations": 4,
        "cities": ["Abha", "Khamis Mushait", "Najran"]
    }
}

# Asset Types Configuration
ASSET_TYPES = {
    "transformer": {
        "prefix": "TR",
        "names": ["Power Transformer", "Distribution Transformer", "Auto Transformer"],
        "manufacturers": ["ABB", "Siemens", "GE", "Hitachi", "Schneider"],
        "ratings": ["132/33 kV", "33/11 kV", "11/0.4 kV", "220/132 kV"],
        "tests": ["IR", "PI", "DGA"]
    },
    "switchgear": {
        "prefix": "SG",
        "names": ["GIS Bay", "AIS Switchgear", "Ring Main Unit", "Vacuum Circuit Breaker"],
        "manufacturers": ["ABB", "Siemens", "Schneider", "Eaton", "Mitsubishi"],
        "ratings": ["33 kV", "11 kV", "132 kV"],
        "tests": ["IR", "PI", "PD"]
    },
    "motors": {
        "prefix": "MT",
        "names": ["Induction Motor", "Synchronous Motor", "Pump Motor", "Fan Motor"],
        "manufacturers": ["ABB", "WEG", "Siemens", "Toshiba", "Nidec"],
        "ratings": ["500 kW", "250 kW", "100 kW", "50 kW"],
        "tests": ["IR", "PI"]
    },
    "generators": {
        "prefix": "GN",
        "names": ["Diesel Generator", "Gas Turbine Generator", "Emergency Generator"],
        "manufacturers": ["Caterpillar", "Cummins", "MTU", "Perkins"],
        "ratings": ["2 MVA", "1 MVA", "500 kVA", "250 kVA"],
        "tests": ["IR", "PI"]
    },
    "cables": {
        "prefix": "CB",
        "names": ["XLPE Cable", "PILC Cable", "HV Underground Cable"],
        "manufacturers": ["Prysmian", "Nexans", "NKT", "Brugg"],
        "ratings": ["132 kV", "33 kV", "11 kV"],
        "tests": ["IR", "PD"]
    },
    "ups": {
        "prefix": "UP",
        "names": ["UPS System", "Battery Bank", "Rectifier Unit"],
        "manufacturers": ["APC", "Eaton", "Vertiv", "Schneider"],
        "ratings": ["100 kVA", "50 kVA", "30 kVA"],
        "tests": ["IR"]
    }
}

# Equipment types for Online Monitoring
EQUIPMENT_TYPES = ["Transformer", "Circuit Breaker", "Busbar", "Capacitor Bank", "Reactor", "Disconnect Switch"]

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def random_date(start_year=2020, end_year=2026):
    """Generate a random date between start_year and end_year"""
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).strftime("%Y-%m-%d")

def generate_test_parameters(test_type, is_good=True):
    """Generate realistic test parameters based on test type"""
    if test_type == "IR":
        # Insulation Resistance test
        base_value = random.uniform(800, 2000) if is_good else random.uniform(50, 300)
        return {
            "insulation_resistance_1min": round(base_value, 1),
            "insulation_resistance_10min": round(base_value * 1.3, 1),
            "test_voltage": random.choice([1000, 2500, 5000]),
            "temperature": round(random.uniform(20, 35), 1),
            "humidity": round(random.uniform(40, 70), 1)
        }
    elif test_type == "PI":
        # Polarization Index test
        pi_value = random.uniform(2.5, 4.5) if is_good else random.uniform(1.0, 1.8)
        r1 = random.uniform(500, 1500)
        return {
            "polarization_index": round(pi_value, 2),
            "resistance_1min": round(r1, 1),
            "resistance_10min": round(r1 * pi_value, 1),
            "test_voltage": random.choice([1000, 2500, 5000]),
            "temperature": round(random.uniform(20, 35), 1)
        }
    elif test_type == "DGA":
        # Dissolved Gas Analysis
        if is_good:
            return {
                "hydrogen_h2": round(random.uniform(10, 100), 1),
                "methane_ch4": round(random.uniform(5, 50), 1),
                "ethane_c2h6": round(random.uniform(2, 30), 1),
                "ethylene_c2h4": round(random.uniform(5, 50), 1),
                "acetylene_c2h2": round(random.uniform(0, 5), 1),
                "carbon_monoxide_co": round(random.uniform(100, 400), 1),
                "carbon_dioxide_co2": round(random.uniform(1000, 4000), 1),
                "oxygen_o2": round(random.uniform(5000, 15000), 1),
                "nitrogen_n2": round(random.uniform(30000, 60000), 1),
                "tdcg": round(random.uniform(200, 700), 1)
            }
        else:
            return {
                "hydrogen_h2": round(random.uniform(200, 500), 1),
                "methane_ch4": round(random.uniform(100, 200), 1),
                "ethane_c2h6": round(random.uniform(50, 100), 1),
                "ethylene_c2h4": round(random.uniform(100, 200), 1),
                "acetylene_c2h2": round(random.uniform(10, 50), 1),
                "carbon_monoxide_co": round(random.uniform(500, 800), 1),
                "carbon_dioxide_co2": round(random.uniform(5000, 8000), 1),
                "oxygen_o2": round(random.uniform(15000, 25000), 1),
                "nitrogen_n2": round(random.uniform(50000, 70000), 1),
                "tdcg": round(random.uniform(1000, 2000), 1)
            }
    elif test_type == "PD":
        # Partial Discharge test
        if is_good:
            return {
                "pd_level_max": round(random.uniform(50, 200), 1),
                "pd_level_avg": round(random.uniform(20, 100), 1),
                "apparent_charge": round(random.uniform(10, 100), 1),
                "repetition_rate": round(random.uniform(10, 50), 1),
                "phase_angle": round(random.uniform(0, 360), 1),
                "test_voltage": random.choice([6, 11, 33]),
                "background_noise": round(random.uniform(5, 20), 1)
            }
        else:
            return {
                "pd_level_max": round(random.uniform(500, 2000), 1),
                "pd_level_avg": round(random.uniform(200, 800), 1),
                "apparent_charge": round(random.uniform(200, 1000), 1),
                "repetition_rate": round(random.uniform(100, 500), 1),
                "phase_angle": round(random.uniform(0, 360), 1),
                "test_voltage": random.choice([6, 11, 33]),
                "background_noise": round(random.uniform(30, 80), 1)
            }
    return {}

async def seed_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("GridTech Industries Demo Data Seeder")
    print("=" * 60)
    
    # Check if company already exists
    existing_company = await db.companies.find_one({"company_id": COMPANY_ID})
    if existing_company:
        print(f"\n⚠️  Company '{COMPANY_NAME}' already exists!")
        response = input("Do you want to delete and recreate? (y/n): ")
        if response.lower() != 'y':
            print("Aborting...")
            return
        
        # Delete existing data
        print("\nDeleting existing data...")
        await db.companies.delete_one({"company_id": COMPANY_ID})
        await db.users.delete_many({"company_id": COMPANY_ID})
        await db.sites.delete_many({"company_id": COMPANY_ID})
        
        # Get asset IDs to delete test records
        assets = await db.assets.find({"company_id": COMPANY_ID}).to_list(length=1000)
        asset_ids = [a["asset_id"] for a in assets]
        if asset_ids:
            await db.test_records.delete_many({"asset_id": {"$in": asset_ids}})
        
        await db.assets.delete_many({"company_id": COMPANY_ID})
        await db.mon_substations.delete_many({"tenant_id": COMPANY_ID})
        await db.mon_equipment.delete_many({"tenant_id": COMPANY_ID})
        await db.cross_module_links.delete_many({"company_id": COMPANY_ID})
        print("✓ Existing data deleted")
    
    # 1. Create Company
    print("\n1. Creating Company...")
    company = {
        "company_id": COMPANY_ID,
        "company_name": COMPANY_NAME,
        "company_code": COMPANY_CODE,
        "industry": "Power & Utilities",
        "contact_email": "contact@gridtech-industries.com",
        "contact_phone": "+966 11 234 5678",
        "address": "King Fahd Road, Riyadh, Saudi Arabia",
        "subscription": {
            "plan": "enterprise",
            "modules": {
                "asset_management": {"enabled": True, "tier": "enterprise"},
                "online_monitoring": {"enabled": True, "tier": "enterprise"},
                "production_testing": {"enabled": True, "tier": "enterprise"}
            },
            "status": "active"
        },
        "branding": {
            "primary_color": "#1e40af",
            "secondary_color": "#3b82f6"
        },
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "source": "seeded"
    }
    await db.companies.insert_one(company)
    print(f"   ✓ Company: {COMPANY_NAME} ({COMPANY_ID})")
    
    # 2. Create Admin User
    print("\n2. Creating Admin User...")
    admin_user = {
        "user_id": f"USER-{uuid.uuid4().hex[:8].upper()}",
        "username": ADMIN_USERNAME,
        "hashed_password": hash_password(ADMIN_PASSWORD),
        "email": ADMIN_EMAIL,
        "full_name": ADMIN_FULL_NAME,
        "role": "admin",
        "company_id": COMPANY_ID,
        "company_name": COMPANY_NAME,
        "designation": "Technical Director",
        "phone": "+966 50 987 6543",
        "is_active": True,
        "regions": ["central", "eastern", "western", "southern"],
        "site_access": [],
        "created_at": datetime.now(timezone.utc),
        "source": "seeded"
    }
    await db.users.insert_one(admin_user)
    print(f"   ✓ Admin: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
    
    # Track created data for summary
    sites_created = []
    assets_created = []
    substations_created = []
    equipment_created = []
    cross_links_created = []
    test_records_created = []
    
    # 3. Create Sites, Assets, Substations, Equipment per Region
    print("\n3. Creating Regional Data...")
    
    substation_counter = 0
    # Track site names per city to ensure uniqueness
    city_site_counters = {}
    
    for region_key, region_config in REGIONS.items():
        region_name = region_config["name"]
        num_substations = region_config["substations"]
        cities = region_config["cities"]
        
        print(f"\n   {region_name}:")
        
        for i in range(num_substations):
            substation_counter += 1
            city = cities[i % len(cities)]
            
            # Increment city-specific counter for unique naming
            if city not in city_site_counters:
                city_site_counters[city] = 0
            city_site_counters[city] += 1
            
            # Create Site (Asset Performance)
            site_id = generate_id("SITE")
            site_name = f"{city} Substation {city_site_counters[city]}"
            
            # Randomize asset counts per site
            num_transformers = random.randint(2, 4)
            num_switchgear = random.randint(2, 4)
            num_motors = random.randint(1, 2)
            num_generators = random.randint(0, 1)
            num_cables = random.randint(1, 3)
            num_ups = random.randint(0, 1)
            
            total_assets = num_transformers + num_switchgear + num_motors + num_generators + num_cables + num_ups
            
            site = {
                "site_id": site_id,
                "company_id": COMPANY_ID,
                "site_name": site_name,
                "location": f"{city}, {region_name}",
                "region": region_key,
                "region_name": region_name,
                "status": random.choice(["operational", "operational", "operational", "maintenance"]),
                "total_assets": total_assets,
                "health_score": random.randint(70, 98),
                "critical_alerts": random.randint(0, 2),
                "warning_alerts": random.randint(0, 5),
                "asset_breakdown": {
                    "transformer": num_transformers,
                    "switchgear": num_switchgear,
                    "motors": num_motors,
                    "generators": num_generators,
                    "cables": num_cables,
                    "ups": num_ups
                },
                "site_incharge": {
                    "name": random.choice(["Ahmed Hassan", "Mohammed Ali", "Khalid Omar", "Fahad Ibrahim"]),
                    "designation": "Site Manager",
                    "phone": f"+966 5{random.randint(0,9)} {random.randint(100,999)} {random.randint(1000,9999)}",
                    "email": f"site.manager{substation_counter}@gridtech.com"
                },
                "voltage_level": random.choice(["132 kV", "33 kV", "11 kV"]),
                "latitude": round(random.uniform(18.0, 28.0), 4),
                "longitude": round(random.uniform(36.0, 50.0), 4),
                "created_at": datetime.now(timezone.utc),
                "source": "seeded"
            }
            await db.sites.insert_one(site)
            sites_created.append(site_name)
            
            # Create corresponding Substation (Online Monitoring)
            substation_code = f"SS-{COMPANY_CODE}-{substation_counter:03d}"
            substation = {
                "substation_id": generate_id("SUB"),
                "name": site_name,
                "code": substation_code,
                "region": region_key,
                "region_name": region_name,
                "voltage_level": site["voltage_level"],
                "latitude": site["latitude"],
                "longitude": site["longitude"],
                "address": site["location"],
                "tenant_id": COMPANY_ID,
                "risk_score": random.randint(10, 40),
                "equipment_count": 0,  # Will update after adding equipment
                "status": "active",
                "created_at": datetime.now(timezone.utc),
                "source": "seeded"
            }
            await db.mon_substations.insert_one(substation)
            substations_created.append(substation_code)
            
            # Create Assets for this site
            asset_configs = [
                ("transformer", num_transformers),
                ("switchgear", num_switchgear),
                ("motors", num_motors),
                ("generators", num_generators),
                ("cables", num_cables),
                ("ups", num_ups)
            ]
            
            site_equipment_count = 0
            for asset_type, count in asset_configs:
                type_config = ASSET_TYPES[asset_type]
                
                for j in range(count):
                    asset_id = generate_id(f"AST-{type_config['prefix']}")
                    asset_name = f"{random.choice(type_config['names'])} {j+1}"
                    
                    asset = {
                        "asset_id": asset_id,
                        "company_id": COMPANY_ID,
                        "site_id": site_id,
                        "site_ids": [site_id],
                        "asset_name": asset_name,
                        "asset_type": asset_type,
                        "manufacturer": random.choice(type_config["manufacturers"]),
                        "model": f"Model-{random.randint(100, 999)}",
                        "serial_number": f"SN-{uuid.uuid4().hex[:10].upper()}",
                        "installation_date": random_date(2015, 2023),
                        "rated_capacity": random.choice(type_config["ratings"]),
                        "voltage_rating": random.choice(type_config["ratings"]),
                        "status": random.choice(["operational", "operational", "operational", "maintenance"]),
                        "health_score": random.randint(65, 98),
                        "last_test_date": random_date(2024, 2026),
                        "next_maintenance": random_date(2026, 2027),
                        "location_detail": f"Bay {j+1}, {site_name}",
                        "nameplate_details": {
                            "manufacturer": random.choice(type_config["manufacturers"]),
                            "year_of_manufacture": str(random.randint(2010, 2022)),
                            "rated_power": random.choice(type_config["ratings"]),
                            "cooling_type": random.choice(["ONAN", "ONAF", "OFAF"]) if asset_type == "transformer" else None
                        },
                        "applicable_tests": type_config["tests"],
                        "created_at": datetime.now(timezone.utc),
                        "source": "seeded"
                    }
                    await db.assets.insert_one(asset)
                    assets_created.append(asset_id)
                    
                    # Create corresponding Equipment (Online Monitoring)
                    equipment_code = f"EQ-{substation_code}-{site_equipment_count+1:03d}"
                    equipment_type = "Transformer" if asset_type == "transformer" else \
                                   "Circuit Breaker" if asset_type == "switchgear" else \
                                   random.choice(EQUIPMENT_TYPES)
                    
                    equipment = {
                        "equipment_id": generate_id("EQP"),
                        "substation_id": substation["substation_id"],
                        "substation_code": substation_code,
                        "equipment_type": equipment_type,
                        "name": asset_name,
                        "code": equipment_code,
                        "rating": random.choice(type_config["ratings"]),
                        "manufacturer": asset["manufacturer"],
                        "installation_date": asset["installation_date"],
                        "health_status": random.choice(["healthy", "healthy", "healthy", "warning"]),
                        "risk_score": random.randint(5, 35),
                        "tenant_id": COMPANY_ID,
                        "linked_asset_id": asset_id,
                        "created_at": datetime.now(timezone.utc),
                        "source": "seeded"
                    }
                    await db.mon_equipment.insert_one(equipment)
                    equipment_created.append(equipment_code)
                    site_equipment_count += 1
                    
                    # Create Cross-Module Link
                    cross_link = {
                        "link_id": generate_id("LINK"),
                        "equipment_code": equipment_code,
                        "equipment_id": equipment["equipment_id"],
                        "linked_asset_id": asset_id,
                        "company_id": COMPANY_ID,
                        "created_at": datetime.now(timezone.utc),
                        "source": "seeded"
                    }
                    await db.cross_module_links.insert_one(cross_link)
                    cross_links_created.append(cross_link["link_id"])
                    
                    # Create Test Records for this asset
                    for test_type in type_config["tests"]:
                        # Create 3-5 historical test records per test type
                        num_tests = random.randint(3, 5)
                        test_dates = sorted([random_date(2024, 2026) for _ in range(num_tests)])
                        
                        for k, test_date in enumerate(test_dates):
                            # Most tests pass, occasional warnings
                            is_good = random.random() > 0.15
                            status = "Passed" if is_good else random.choice(["Warning", "Failed"])
                            
                            test_record = {
                                "record_id": generate_id("REC"),
                                "asset_id": asset_id,
                                "test_code": f"{test_type}-{test_date.replace('-', '')}-{k+1:03d}",
                                "test_type": test_type,
                                "test_name": {
                                    "IR": "Insulation Resistance Test",
                                    "PI": "Polarization Index Test",
                                    "DGA": "Dissolved Gas Analysis",
                                    "PD": "Partial Discharge Test"
                                }.get(test_type, test_type),
                                "test_date": test_date,
                                "status": status,
                                "tested_by": random.choice(["Ahmed Hassan", "Mohammed Ali", "Khalid Omar"]),
                                "parameters": generate_test_parameters(test_type, is_good),
                                "notes": f"Routine {test_type} test - {status}",
                                "created_at": datetime.now(timezone.utc),
                                "source": "seeded"
                            }
                            await db.test_records.insert_one(test_record)
                            test_records_created.append(test_record["record_id"])
            
            # Update substation equipment count
            await db.mon_substations.update_one(
                {"substation_id": substation["substation_id"]},
                {"$set": {"equipment_count": site_equipment_count}}
            )
            
            print(f"      ✓ {site_name}: {total_assets} assets, {site_equipment_count} equipment")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"\n📦 Company: {COMPANY_NAME}")
    print(f"👤 Admin User: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
    print(f"\n📊 Data Created:")
    print(f"   • Sites (Asset Performance): {len(sites_created)}")
    print(f"   • Assets: {len(assets_created)}")
    print(f"   • Substations (Online Monitoring): {len(substations_created)}")
    print(f"   • Equipment: {len(equipment_created)}")
    print(f"   • Cross-Module Links: {len(cross_links_created)}")
    print(f"   • Test Records: {len(test_records_created)}")
    
    print(f"\n🌍 Regional Distribution:")
    for region_key, region_config in REGIONS.items():
        print(f"   • {region_config['name']}: {region_config['substations']} substations")
    
    print("\n" + "=" * 60)
    print("✅ Seeding completed successfully!")
    print("=" * 60)
    print(f"\n🔐 Login Credentials:")
    print(f"   Username: {ADMIN_USERNAME}")
    print(f"   Password: {ADMIN_PASSWORD}")
    print("\n💡 You can now export this company data using:")
    print("   Data Management > Complete Company Export")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(seed_data())
