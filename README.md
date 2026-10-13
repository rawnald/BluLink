# BluLink — Geospatial & Link Analysis Intelligence Workspace

An Integrated Platform for Geospatial Intelligence, Link Analysis, and Intelligence Data Management
Developed b: Rawnald Blu

---

## ⚡ Overview
The Geospatial & Link Analysis Intelligence Workspace is a web-based analytical platform designed to organize, visualize, and analyze geospatial information, entities, and relationships within a unified workspace.

The platform aims to support intelligence analysts and authorized users by bringing together map-based visualization, relationship analysis, structured information management, and analytical reporting through an interactive dashboard.

Its objective is to improve situational awareness, information organization, and the presentation of analytical findings for informed decision-making.
---

## 🎯 Objective

--Consolidate relevant geospatial and analytical information in one workspace.
--Visualize geographic information through interactive mapping tools.
--Identify and examine relationships among entities using link analysis.
--Organize intelligence records and projects
--Support authorized users in maintaining organized and traceable analytical records.

## ✨ Core Capabilities

🗺️ 1. Geospatial Intelligence Workspace

--Interactive geographic map visualization.
--Display of geographic features and Basemap layers.
--Geographic search and location-based information management.
--Map markers, labels, and relevant feature details.
--Configurable map views and layer controls.

🔗 2. Link Analysis

--Visual representation of entities and their relationships.
--Relationship mapping between persons, organizations, locations, events, and other record types.
--Interactive node-and-edge network diagrams.
--Entity profile and relationship details.
--Support for examining connections across authorized datasets.

## 🖥️ Technology Stack

--Frontend: Single-page application using Leaflet (Google Hybrid, Satellite, Terrain layers) and Vis.js Network.
--Backend: Cloudflare Pages Functions (/api/auth/* and /api/workspace/*).
--Database: Cloudflare D1 (Serverless SQLite edge database with zero cold-starts).
--Security: Web Crypto API salted SHA-256 password hashing 

## 🚀 How to Use

--1. Register and Login using your gmail account at https://blulink.pages.dev/
--2. Create Project
--3. Drag and Drop Entities from Palette
--4. Create Link to another Entities and Automatically show in the map
--5. Print and Export for Presentation and Visualization

