# BluLink — Geospatial & Link Analysis Intelligence Workspace

An Integrated Platform for Geospatial Intelligence, Link Analysis, and Intelligence Data Management
Developed by: Rawnald Blu

---

## ⚡ Overview
The Geospatial & Link Analysis Intelligence Workspace is a web-based analytical platform designed to organize, visualize, and analyze geospatial information, entities, and relationships within a unified workspace.

The platform aims to support intelligence analysts and authorized users by bringing together map-based visualization, relationship analysis, structured information management, and analytical reporting through an interactive dashboard.

Its objective is to improve situational awareness, information organization, and the presentation of analytical findings for informed decision-making.
---

## 🎯 Objective

Consolidate relevant geospatial and analytical information in one workspace. <br>
Visualize geographic information through interactive mapping tools.<br>
Identify and examine relationships among entities using link analysis.<br>
Organize intelligence records and projects<br>
Support authorized users in maintaining organized and traceable analytical records.

## ✨ Core Capabilities

🗺️ 1. Geospatial Intelligence Workspace

Interactive geographic map visualization.<br>
Display of geographic features and Basemap layers.<br>
Geographic search and location-based information management.<br>
Map markers, labels, and relevant feature details.<br>
Configurable map views and layer controls.

🔗 2. Link Analysis

Visual representation of entities and their relationships.<br>
Relationship mapping between persons, organizations, locations, events, and other record types.<br>
Interactive node-and-edge network diagrams.<br>
Entity profile and relationship details.<br>
Support for examining connections across authorized datasets.

## 🖥️ Technology Stack

Frontend: Single-page application using Leaflet (Google Hybrid, Satellite, Terrain layers) and Vis.js Network.<br>
Backend: Cloudflare Pages Functions (/api/auth/* and /api/workspace/*).<br>
Database: Cloudflare D1 (Serverless SQLite edge database with zero cold-starts)<br>
Security: Web Crypto API salted SHA-256 password hashing 

## 🚀 How to Use

1. Register and Login using your gmail account at https://blulink.pages.dev/<br>
2. Create Project<br>
3. Drag and Drop Entities from Palette<br>
4. Create Link to another Entities and Automatically show in the map<br>
5. Print and Export for Presentation and Visualization

