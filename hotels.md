Oui Mohamed 🔥 Pour intégrer **la gestion des hôtels dans FasoStock**, il faut penser comme un **mini PMS hôtelier** : gestion des chambres, réservations, clients, nuitées, caisse, factures, stocks, ménage, maintenance et rapports.

Au Burkina Faso, les hôtels/établissements touristiques d’hébergement sont bien encadrés : la loi burkinabè sur le tourisme couvre les **établissements touristiques d’hébergement** et les **restaurants de tourisme**. Elle prévoit notamment l’autorisation d’exploiter, le classement catégoriel, l’affichage des tarifs/autorisations, l’assurance responsabilité civile professionnelle, et des obligations liées à l’hygiène/santé publique.

---

# 1. Comment un hôtel se gère concrètement

Un hôtel vend principalement des **nuitées**. Donc FasoStock doit gérer ce cycle :

```text
Réservation → Check-in → Séjour → Services consommés → Check-out → Paiement → Facture/Rapport
```

## Exemple simple

Un client arrive à l’hôtel :

1. Le réceptionniste vérifie les chambres libres.
2. Il choisit une chambre : Chambre 204, catégorie Standard.
3. Il enregistre le client : nom, téléphone, pièce d’identité si nécessaire.
4. Il définit la durée : 2 nuits.
5. Il encaisse une avance ou le paiement complet.
6. Pendant le séjour, le client peut consommer : restaurant, boisson, pressing, petit-déjeuner.
7. À la sortie, FasoStock calcule :
   - prix des nuitées ;
   - consommations ;
   - réductions ;
   - taxes éventuelles ;
   - montant payé ;
   - reste à payer.

---

# 2. Pages principales à créer dans FasoStock

## A. Tableau de bord Hôtel

Page centrale pour voir rapidement l’état de l’hôtel.

### À afficher :

- Chambres libres
- Chambres occupées
- Chambres réservées
- Chambres en nettoyage
- Chambres en maintenance
- Arrivées du jour
- Départs du jour
- Chiffre d’affaires du jour
- Paiements reçus
- Impayés
- Taux d’occupation

### Exemple UI :

```text
Aujourd’hui
- 12 chambres libres
- 8 chambres occupées
- 3 départs prévus
- 5 arrivées prévues
- CA du jour : 185 000 FCFA
```

---

## B. Gestion des chambres

C’est une page obligatoire.

### Fonctionnalités :

- Ajouter une chambre
- Modifier une chambre
- Désactiver une chambre
- Mettre une chambre en maintenance
- Voir l’état de chaque chambre

### Champs :

- Numéro de chambre
- Type de chambre
- Étage
- Capacité
- Prix par nuit
- Prix journée / court séjour si l’hôtel le fait
- Statut :
  - libre ;
  - occupée ;
  - réservée ;
  - sale ;
  - en nettoyage ;
  - en maintenance.

### Exemple :

| Chambre |     Type |   Prix/nuit | Statut    |
| ------- | -------: | ----------: | --------- |
| 101     | Standard | 15 000 FCFA | Libre     |
| 102     |      VIP | 30 000 FCFA | Occupée   |
| 103     | Standard | 15 000 FCFA | Nettoyage |

---

## C. Types de chambres

Cette page permet de créer les catégories.

### Exemples :

- Chambre simple
- Chambre double
- Chambre ventilée
- Chambre climatisée
- Chambre VIP
- Suite
- Appartement meublé

### Champs :

- Nom du type
- Description
- Nombre de personnes maximum
- Prix normal
- Prix week-end
- Prix spécial entreprise
- Caution éventuelle
- Équipements :
  - climatiseur ;
  - TV ;
  - Wi-Fi ;
  - douche interne ;
  - frigo ;
  - balcon ;
  - petit-déjeuner inclus ou non.

---

## D. Planning des réservations

Très important pour éviter les conflits de réservation.

### Vue recommandée :

Une vue calendrier avec les chambres en ligne et les dates en colonne.

```text
          28 Juin   29 Juin   30 Juin
Ch.101    Libre     Réservée  Occupée
Ch.102    Occupée   Occupée   Libre
Ch.103    Libre     Libre     Libre
```

### Fonctionnalités :

- Créer une réservation
- Modifier les dates
- Annuler une réservation
- Déplacer une réservation vers une autre chambre
- Voir les arrivées/départs
- Filtrer par statut

---

## E. Réservations

Page détaillée pour gérer les réservations avant l’arrivée du client.

### Champs :

- Client
- Téléphone
- Chambre ou type de chambre demandé
- Date d’arrivée
- Date de départ
- Nombre de nuits
- Nombre de personnes
- Prix négocié
- Avance payée
- Statut :
  - en attente ;
  - confirmée ;
  - annulée ;
  - expirée ;
  - transformée en séjour.

### Sources de réservation possibles :

- Réception directe
- Téléphone
- WhatsApp
- Facebook
- Site web
- Agence
- Entreprise partenaire

---

## F. Check-in / Entrée client

C’est la page utilisée quand le client arrive réellement.

### Actions :

- Rechercher une réservation existante
- Créer un séjour direct sans réservation
- Attribuer une chambre
- Enregistrer le client
- Encaisser une avance
- Imprimer reçu ou facture provisoire

### Champs client :

- Nom complet
- Téléphone
- Nationalité
- Type de pièce
- Numéro de pièce
- Adresse
- Entreprise, si client professionnel
- Observations

Je recommande de rendre certains champs **configurables**, car les pratiques peuvent varier selon les hôtels.

---

## G. Séjours en cours

Page qui affiche tous les clients actuellement logés.

### À afficher :

- Client
- Chambre
- Date d’entrée
- Date de sortie prévue
- Nombre de nuits
- Montant total
- Montant payé
- Reste à payer
- Consommations ajoutées
- Statut du séjour

### Actions :

- Ajouter une nuit
- Changer de chambre
- Ajouter une consommation
- Encaisser un paiement
- Faire le check-out
- Imprimer la situation du client

---

## H. Services et consommations

Un hôtel ne vend pas seulement des chambres.

### Services possibles :

- Petit-déjeuner
- Restaurant
- Bar
- Eau minérale
- Boisson
- Pressing
- Location salle
- Transport
- Wi-Fi premium
- Piscine
- Caution
- Pénalité de retard
- Dégradation matériel

### Fonctionnalité clé :

Quand un client consomme quelque chose, FasoStock doit pouvoir l’ajouter directement à sa chambre.

Exemple :

```text
Client chambre 204
+ 2 eaux minérales : 1 000 FCFA
+ 1 plat riz sauce : 2 500 FCFA
+ Pressing : 3 000 FCFA
```

Au check-out, tout sort sur une seule facture.

---

## I. Caisse hôtel

Page très importante, surtout pour le propriétaire.

### Moyens de paiement :

- Espèces
- Orange Money
- Moov Money
- Virement
- Carte bancaire
- Paiement mixte
- Crédit client / entreprise

### À gérer :

- Encaissements
- Remboursements
- Avances
- Restes à payer
- Dépenses internes
- Clôture de caisse par réceptionniste
- Historique des mouvements

### Exemple :

| Heure |            Opération | Montant | Moyen        | Agent     |
| ----- | -------------------: | ------: | ------------ | --------- |
| 08:30 | Paiement chambre 101 |  15 000 | Espèces      | Réception |
| 10:12 |   Avance réservation |  10 000 | Orange Money | Réception |
| 12:00 |          Achat savon |  -5 000 | Espèces      | Gérant    |

---

## J. Facturation et reçus

Cette page doit permettre de générer des documents propres.

### Documents :

- Reçu d’avance
- Facture simple
- Facture client entreprise
- Facture proforma
- Reçu de paiement
- Ticket thermique
- Rapport de séjour

### Facture hôtel :

Elle doit contenir :

- Nom de l’hôtel
- IFU / RCCM si disponible
- Client
- Chambre
- Dates du séjour
- Nombre de nuitées
- Détail des services
- Taxes configurées
- Total payé
- Reste à payer
- Signature/cachet

---

## K. Taxe de développement touristique

À intégrer sérieusement.

La DGI du Burkina Faso propose un formulaire de **déclaration de la taxe de développement touristique pour les établissements hôteliers**. Le document indique des tarifs par personne et par nuitée : **1000 FCFA** pour les établissements classés trois étoiles et plus, **700 FCFA** pour deux étoiles, **500 FCFA** pour une étoile, et **200 FCFA** pour les établissements non classés. ([DGI][1])

### Page à créer :

**Taxes & Déclarations**

### Fonctionnalités :

- Définir le classement de l’hôtel :
  - non classé ;
  - 1 étoile ;
  - 2 étoiles ;
  - 3 étoiles et plus.

- Calculer automatiquement la taxe par nuitée/personne.
- Générer un rapport mensuel ou trimestriel.
- Exporter en PDF/Excel.
- Voir :
  - nombre de clients ;
  - nombre de nuitées ;
  - taxe totale à déclarer.

### Important :

Ne mets pas les taux fiscaux en dur dans le code. Il faut une page **Paramètres fiscaux**, car les montants peuvent changer.

---

## L. Ménage / Housekeeping

Après chaque départ, la chambre ne doit pas devenir directement “libre”. Elle doit passer par “à nettoyer”.

### Statuts recommandés :

- Propre
- Sale
- En nettoyage
- Contrôlée
- Bloquée
- Maintenance

### Actions :

- Assigner une chambre à nettoyer
- Marquer comme nettoyée
- Signaler un problème
- Ajouter photo/remarque
- Historique du ménage

---

## M. Maintenance

Page pour gérer les problèmes techniques.

### Exemples :

- Climatisation en panne
- Douche cassée
- Ampoule grillée
- Serrure bloquée
- TV ne marche pas
- Fuite d’eau

### Statuts :

- Signalé
- En cours
- Résolu
- Non résolu
- Chambre bloquée

---

## N. Gestion du stock hôtelier

C’est ici que FasoStock devient très puissant 💪

Un hôtel utilise beaucoup de stock :

- Draps
- Serviettes
- Savon
- Papier toilette
- Eau minérale
- Boissons
- Produits restaurant
- Produits de nettoyage
- Ampoules
- Cartes/chips d’accès
- Produits minibar

### Modules à connecter :

- Stock principal
- Stock bar
- Stock restaurant
- Stock étage
- Stock ménage
- Alertes de rupture
- Sorties de stock liées aux chambres

Exemple :

```text
Check-in chambre VIP :
- 2 savons sortis du stock
- 2 bouteilles d’eau offertes
- 2 serviettes affectées
```

---

## O. Restaurant / Bar de l’hôtel

Si l’hôtel a un restaurant ou un bar, il faut l’intégrer comme une activité FasoStock.

### Pages :

- Menu restaurant
- Commandes
- Tables
- Cuisine
- Bar
- Consommations par chambre
- Paiement direct
- Paiement à la sortie

### Cas important :

Un client peut manger et dire :

> “Ajoutez ça sur ma chambre.”

Donc la commande restaurant doit pouvoir être liée à une chambre.

---

## P. Clients et entreprises

Page CRM pour garder l’historique.

### Types de clients :

- Client particulier
- Client entreprise
- Client VIP
- Client régulier
- Client débiteur
- Agence partenaire

### Informations utiles :

- Historique des séjours
- Montant total dépensé
- Préférences
- Dettes
- Remises accordées
- Documents/factures

---

## Q. Tarifs et saisons

Un hôtel peut avoir plusieurs tarifs.

### Exemples :

- Tarif normal
- Tarif week-end
- Tarif événement
- Tarif entreprise
- Tarif longue durée
- Tarif négocié
- Tarif basse saison
- Tarif haute saison

### Fonctionnalités :

- Créer plusieurs grilles tarifaires
- Appliquer par type de chambre
- Appliquer par période
- Appliquer une remise manuelle
- Bloquer un prix minimum pour éviter les abus

---

## R. Rapports hôtel

Page indispensable pour le propriétaire.

### Rapports à prévoir :

- Chiffre d’affaires journalier
- Chiffre d’affaires mensuel
- Taux d’occupation
- Chambres les plus rentables
- Nuitées vendues
- Clients récurrents
- Impayés
- Dépenses
- Bénéfice estimé
- Taxes collectées
- Consommations restaurant/bar
- Performance par réceptionniste

### Indicateurs professionnels :

- **Taux d’occupation**

  ```text
  chambres occupées / chambres disponibles × 100
  ```

- **Prix moyen par chambre occupée**

  ```text
  revenu chambres / nombre de chambres vendues
  ```

- **Revenu par chambre disponible**

  ```text
  revenu chambres / nombre de chambres disponibles
  ```

---

# 3. Pages finales à ajouter dans FasoStock

Voici la liste propre des pages que je te conseille :

## Module Hôtel

1. **Dashboard Hôtel**
2. **Planning des chambres**
3. **Chambres**
4. **Types de chambres**
5. **Réservations**
6. **Check-in**
7. **Séjours en cours**
8. **Check-out**
9. **Clients**
10. **Entreprises / agences**
11. **Services & consommations**
12. **Restaurant / Bar**
13. **Ménage**
14. **Maintenance**
15. **Caisse hôtel**
16. **Factures & reçus**
17. **Paiements**
18. **Dettes / impayés**
19. **Stock hôtelier**
20. **Achats & dépenses**
21. **Taxes & déclarations**
22. **Rapports**
23. **Paramètres hôtel**
24. **Utilisateurs & permissions**

---

# 4. États essentiels à gérer

## Chambre

```text
Libre
Réservée
Occupée
À nettoyer
En nettoyage
Propre
Maintenance
Bloquée
```

## Réservation

```text
En attente
Confirmée
Annulée
No-show
Transformée en séjour
Terminée
```

## Séjour

```text
En cours
Prolongé
Terminé
Impayé
Partiellement payé
Payé
```

## Paiement

```text
Payé
Partiel
Impayé
Remboursé
Annulé
```

---

# 5. Rôles utilisateurs à prévoir

## Propriétaire / Admin

- Accès total
- Rapports financiers
- Paramètres
- Suppression/modification avancée

## Gérant

- Gestion chambres
- Réservations
- Caisse
- Rapports

## Réceptionniste

- Réservations
- Check-in
- Check-out
- Paiements
- Impression reçus

## Femme/agent de ménage

- Voir chambres à nettoyer
- Marquer chambre nettoyée
- Signaler problème

## Restaurant / Bar

- Prendre commande
- Ajouter à une chambre
- Encaisser paiement direct

## Comptable

- Factures
- Paiements
- Taxes
- Rapports

---

# 6. Ce que FasoStock doit faire mieux que les petits cahiers

Le vrai problème de beaucoup de petits hôtels, c’est :

- les réservations notées dans un cahier ;
- les chambres mal suivies ;
- les paiements non tracés ;
- les avances oubliées ;
- les stocks qui disparaissent ;
- les impayés difficiles à suivre ;
- les rapports faits à la main ;
- le propriétaire qui ne voit rien à distance.

Donc FasoStock doit vendre cette promesse :

> **“FasoStock permet aux hôtels de gérer les chambres, les réservations, les clients, la caisse, le stock, les factures et les rapports depuis une seule plateforme.”**

---

# 7. Fonctionnalités premium à ajouter plus tard

Après la version de base, tu peux ajouter :

- Réservation en ligne
- Paiement mobile money
- Confirmation automatique WhatsApp
- Rappel automatique avant arrivée
- Facture envoyée par WhatsApp
- QR code chambre
- Carte client fidèle
- Gestion multi-hôtels
- Portail propriétaire
- Application mobile réception
- Connexion serrure intelligente, plus tard
- Agent WhatsApp IA pour prendre les réservations

---

# 8. Structure simple de base de données

Voici les entités principales :

```text
hotels
room_types
rooms
clients
reservations
stays
stay_guests
payments
invoices
invoice_items
services
service_consumptions
housekeeping_tasks
maintenance_tickets
hotel_expenses
tax_settings
tourism_tax_reports
hotel_users
```

---

# 9. Version MVP à développer en premier

Pour ne pas trop compliquer, commence avec ces pages :

1. Dashboard hôtel
2. Chambres
3. Types de chambres
4. Réservations
5. Check-in
6. Séjours en cours
7. Check-out + facture
8. Paiements
9. Clients
10. Rapports simples

Ensuite tu ajoutes :

- ménage ;
- maintenance ;
- restaurant/bar ;
- stock hôtelier ;
- taxes ;
- WhatsApp.

---

## Conclusion claire

Pour FasoStock, la gestion hôtelière doit être organisée autour de **la chambre**, **le client**, **la réservation**, **le séjour**, **la caisse**, **la facture** et **le stock**.

Le module doit permettre à un hôtel au Burkina Faso de savoir à tout moment :

```text
Quelles chambres sont libres ?
Qui dort où ?
Qui a payé ?
Qui doit encore payer ?
Quelles consommations ont été ajoutées ?
Combien l’hôtel a gagné aujourd’hui ?
Quel stock est sorti ?
Quelles taxes doivent être suivies ?
```

C’est ça qui rendra FasoStock très fort pour les hôtels. 🚀

[1]: https://dgi.bf/wp-content/uploads/2023/10/DECLARATION-DE-LA-TAXE-DE-DEVELOPPEMENT-TOURISTIQUE-ETABLISSEMENTS-HOTELIERS-.pdf "Microsoft Word - dsf_imp_tdt_hotels.doc"
