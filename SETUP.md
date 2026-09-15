# Rental Desk — setup

## 1) Open the app (required for PWA)
```bash
cd app
python3 -m http.server 8765
```
Open http://localhost:8765 (http/https required for service worker).

## 2) Install
Add to Home Screen / Install when the browser offers it.

## 3) Clear sample / import your units
Demo Botha Rentals ships as sample. Settings → Export / Import JSON (confirm replace). Practice with `sample/sample-import.json` then replace with your own Export.

## 4) Rent → handover → snags → deposit
- Today shows due ProcessRunner cases
- Complete a stage → next due returns when due
- Store tenant / contractor / account links you already use
- **Approve** deposit deductions and release yourself — app prepares only

## 5) Notifications & backup
Settings → notifications + quiet hours (alerts only while app is open).  
Settings → Export / Import JSON with confirm replace.
