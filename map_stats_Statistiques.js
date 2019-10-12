
// Actions réalisées automatiquement lors de l'ouverture de la page


	// Initialisation de la carte
		
		
			var mymap = L.map('stats_Statistiques_section_mapid');
			
			
			// récupération de la cartographie
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				minZoom: 10,
				maxZoom: 20,
				id: 'mapbox.streets',
				accessToken: 'pk.eyJ1IjoiYWxleGdnbiIsImEiOiJjanp3Znhza3YweWNzM2d1dGJpdTdwN295In0.ClcjKK7G2XM3NvUrWKx_OA'
			}).addTo(mymap);
			
			
			// création du LayerGroup "affichage stats"
			mapStats = new L.LayerGroup();
			mymap.addLayer(mapStats);
			
			// création du LayerGroup "marqueurs de la carte"
			mapMarkers = new L.LayerGroup();
			mymap.addLayer(mapMarkers);
	
		
		
		


	// Ouvre l'accès à la BDD des adresses et récupère les villes de la BDD, et le pas et les coordonnées limites de la carte raster
			
			
		// Villes

			class Ville {
				constructor(id, nom, debut, fin) {
					this.id = id; // numéro d'identité de la ville
					this.nom = nom; // nom de la ville
					this.debut = debut; // indice de début de la ville dans la BDD
					this.fin = fin; // indice de fin de la ville dans la BDD
				}
			}

			var villes = []; // liste des villes dans la BDD

			// indices de début et de fin pour l'affichage de la carte pour la ville sélectionnée
			var ville_debut = 0;
			var ville_fin = 0;
			
			
			
		
		// Pas et des coordonnées limites de la carte raster
		
			
			// pas minimum en latitude et en longitude de la carte raster
			var lat_pas_min = 0;
			var lon_pas_min = 0;
			
			// coefficient multiplicateur du pas de la carte raster
			var pas = 10**5;
		
			// coordonnées limites et pas en latitude et en longitude
			var lat_minC = 0;
			var lat_maxC = 0;
			var lat_pasC = 0;
			var lon_minC = 0;
			var lon_maxC = 0;
			var lon_pasC = 0;
			
			// coordonnées limites en x et y de la carte raster
			var a_max = 0;
			var b_max = 0;
			
			
			
			
		// Ouverture de l'accès à la base de données (BDD) des adresses
			
			
			var request_adressesURL = 'https://raw.githubusercontent.com/AlexGgn/hello-world/master/adresses.json';
			var request_adresses = new XMLHttpRequest();
			request_adresses.open('GET', request_adressesURL);
			request_adresses.responseType = 'json';
			request_adresses.send();
			request_adresses.onload = function() {
				var adresses = request_adresses.response;
				creerBDD_adresses(adresses); // crée la base de données des adresses en local
				recupVilles(); // rempli la liste villes[] et la liste déroulante de la carte d'autocorrélation spatiale
				pasMin(); // récupère le pas minimum en latitude et en longitude de la carte ratser
				coordLimites(); // récupère les coordonnées limites de la carte
				ajusterCarte(); // ajuste le zoom de la carte à l'ensemble des adresses de la BDD
			}
			
			
			var BDD_adresses = []; // base de données des adresses en local
			var ad = 0; // nombre d'adresses dans la BDD
			
			
			// fonction qui rempli la base de données des adresses en local
			function creerBDD_adresses(jsonObj) {
				BDD_adresses = jsonObj;
				ad = BDD_adresses.length;
			}
			
		
		
		
		// Récupération des villes de la BDD
		
		
			// fonction qui récupère les villes de la BDD
			function recupVilles() {
				
				var i = 0; // numéro d'identité de la i-ème ville (auto-implémenté)
				var inom = BDD_adresses[0].ville; // nom de la i-ème ville
				var idebut = 0; // indice de début de la i-ème ville
				
				for (var k=0; k<ad; k++) {
					var ville = BDD_adresses[k].ville; // nom de ville de la k-ième adresse de la BDD
					// si le nom de ville change, on ajoute une i-ème ville, qui va jusqu'à la (k-1)-ème adresse de la BDD (dû à l'ordre de la liste par ville)
					if (ville != inom) {
						ajouterVille(i,inom,idebut,k-1);
						i++;
						inom = ville;
						idebut = k;
					}
				}
				// on ajoute la dernière ville, qui va jusqu'à la dernière adresse de la BDD
				ajouterVille(i,inom,idebut,ad-1);
				
				
				remplirVilles(); // rempli la liste déroulante des villes de la carte d'autocorrélation spatiale
			
				attribuerVille(); // récupère la ville sélectionnée pour l'affichage de la carte d'autocorrélation spatiale
			}
			
			
			
			// fonction qui ajoute une nouvelle ville à la liste villes[]
			function ajouterVille(id, nom, debut, fin) {
				var ville = new Ville(id, nom, debut, fin);
				villes.push(ville);
			}
			
			
			
			// fonction qui rempli la liste déroulante des villes de la carte d'autocorrélation spatiale à partir de la liste villes[]
			function remplirVilles() {
				
				var ville_recherche = document.getElementById('stats_Statistiques_section_ville_liste'); // liste déroulante de la carte d'autocorrélation spatiale
				
				for (var ville of villes) {
					
					var newVille_recherche = document.createElement('option');
					newVille_recherche.setAttribute("value",ville.id);
					newVille_recherche.textContent = ville.nom;
					ville_recherche.appendChild(newVille_recherche);
				}
			}
			
				
				
			// fonction qui récupère la ville sélectionnée pour l'affichage de la carte d'autocorrélation spatiale
			function attribuerVille() {
				
				// récupère l'id de la ville sélectionnée, ce qui donne l'intervalle [ville.debut, ville.fin] de la carte
				var ville_carte = document.getElementById("stats_Statistiques_section_ville_liste").value;
				
				for (var iville of villes) {
					
					if (ville_carte == iville.id) {
						ville_debut = iville.debut;
						ville_fin = iville.fin;
					}
				}
			}
			
		
		
		
		// Récupèration du pas et des coordonnées limites de la carte raster
		
			
			// fonction qui récupère le pas minimum de la carte raster
			function pasMin() {	
				
				// calcul de la plus faible distance entre 2 adresses consécutives (BDD ordononnée par ville, npa puis adresse, donc devrait être distance minimale entre 2 adresses de la BDD) -> diminue le temps de calcul
				// attention aux adresses identiques consécutives (on aurait alors un pas nul)
					
				var lat = 0;
				var lon = 0;
				var lat_next = BDD_adresses[0].latitude;
				var lon_next = BDD_adresses[0].longitude;
				
				var pas_lat = 1;
				var pas_lon = 1;
				
				var lat_moy = lat_next; // latitude moyenne des adresses de la BDD
				
				for (var i=1; i<ad; i++) {
					
					lat = lat_next;
					lon = lon_next;
					lat_next = BDD_adresses[i].latitude;
					lon_next = BDD_adresses[i].longitude;
					
					lat_moy += lat_next;
					
					if (pas_lat > Math.abs(lat_next - lat) && Math.abs(lat_next - lat) > 0) {
						pas_lat = Math.abs(lat_next - lat);
					}
					if (pas_lon > Math.abs(lon_next - lon) && Math.abs(lon_next - lon) > 0) {
						pas_lon = Math.abs(lon_next - lon);
					}
				}
				
				lat_moy = (lat_moy / ad);
				
				// calcule le coefficient latitude/longitude
				lat_moy = lat_moy * Math.PI / 180; // transforme la latitude moyenne en radians (car cos calculé avec des radians)
				var coeff = 1 / Math.cos(lat_moy);
				
				// calcule le pas minimum en latitue et en longitude (afin d'avoir des carrés)
				var pas_min = Math.min(...[pas_lat, pas_lon/coeff]);
				lat_pas_min = pas_min;
				lon_pas_min = pas_min * coeff;
			}
			
			
			
			// fonction qui récupère les coordonnées limites de la carte
			function coordLimites() {	
				
				var latitudes = [];
				var longitudes = [];
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					latitudes.push(BDD_adresses[i].latitude);
					longitudes.push(BDD_adresses[i].longitude);
				}
				
				lat_minC = Math.min(...latitudes);
				lat_maxC = Math.max(...latitudes);
				lat_pasC = pas * lat_pas_min;
				
				lon_minC = Math.min(...longitudes);
				lon_maxC = Math.max(...longitudes);
				lon_pasC = pas * lon_pas_min;
				
				a_max = Math.floor((lat_maxC - lat_minC) / lat_pasC) + 1;
				b_max = Math.floor((lon_maxC - lon_minC) / lon_pasC) + 1;
			}
			
			
		

		// Ajustement du zoom de la carte
		
		
			// fonction qui ajuste le zoom de la carte pour afficher l'ensemble des adresses de la BDD
			function ajusterCarte() {
				
				var c1 = L.latLng(lat_minC, lon_minC);
				var c2 = L.latLng(lat_maxC, lon_maxC);
				
				// ajuste le zoom aux coordonnées limites
				mymap.fitBounds(L.latLngBounds(c1, c2));
			}
		
		
		
		
	
		
	// Ouvre l'accès à la BDD des statistiques et récupère les statistiques et leurs informations
			
			
			class Stat {
				constructor(nom, fonction, affichage, infos) {
					this.nom = nom; // nom de la statistique
					this.fonction = fonction; // fonction associée à la statistique
					this.affichage = affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					this.infos = infos; // informations concernant la statistique
				}
			}
			
			
			var stats = []; // liste des statistiques dans la BDD
			
			
		
		
		// Ouverture de l'accès à la base de données (BDD) des statistiques
			
			
			var request_statsURL = 'https://raw.githubusercontent.com/AlexGgn/hello-world/master/statistiques.json';
			var request_stats = new XMLHttpRequest();
			request_stats.open('GET', request_statsURL);
			request_stats.responseType = 'json';
			request_stats.send();
			request_stats.onload = function() {
				var statistiques = request_stats.response;
				creerBDD_statistiques(statistiques) // crée la base de données des statistiques en local
				recupStats(); // récupère les statistiques de la BDD
			}
			
			
			var BDD_statistiques = []; // base de données des statistiques en local
			var st = 0; // nombre de statistiques dans la base de données
			
			
			// fonction qui remplit la base de données des statistiques en local
			function creerBDD_statistiques(jsonObj) {
				BDD_statistiques = jsonObj;
				st = BDD_statistiques.length;
			}
			
			


		// Récupération des statistiques de la BDD
		
		
			// fonction qui récupère les statistiques de la BDD
			function recupStats() {
				
				for (var k=0; k<st; k++) {
					var nom = BDD_statistiques[k].nom;
					var fonction = BDD_statistiques[k].fonction;
					var affichage = BDD_statistiques[k].affichage;
					var infos = BDD_statistiques[k].informations;
					ajouterStat(nom, fonction, affichage, infos);
				}
				
				remplirStats(); // rempli la fenêtre de choix des statistiques à afficher
			}
			
			
			
			// fonction qui ajoute une nouvelle stat à la liste stats[]
			function ajouterStat(nom, fonction, affichage, infos) {
				var stat = new Stat(nom, fonction, affichage, infos);
				stats.push(stat);
			}
			


			// fonction qui rempli la fenêtre de choix des statistiques à afficher à partir de la liste villes[]
			function remplirStats() {
				
				var statistiques = document.getElementById('stats_Statistiques_menu_statistiques'); // liste des statistiques de la carte
				
				for (var stat of stats) {
					
					var nom = stat.nom; // nom de la statistique
					var fonction = stat.fonction; // fonction associée à la statistique
					var affichage = stat.affichage; // variable indiquant si la statistiques doit apparaître dans le menus des cartes
					
					// si fonction == "", l'élément est un domaine de statistiques
					if (fonction == "") {
						
						var newGroup = document.createElement('br');
						statistiques.appendChild(newGroup);
						
						var newGroup = document.createElement('h3');
						newGroup.setAttribute("class","stats_Statistiques_menu_sous_titre");
						newGroup.textContent = nom;
						statistiques.appendChild(newGroup);
					}
					
					// sinon, l'élément est une statistique
					else {
						
						var newGroup = document.createElement('br');
						statistiques.appendChild(newGroup);
						
						var newStat = document.createElement('input');
						newStat.setAttribute("type","checkbox");
						newStat.setAttribute("name","menu_option_"+nom);
						newStat.setAttribute("id","stats_Statistiques_menu_option_"+nom);
						if (affichage == 1) newStat.setAttribute("checked","true"); // coche les statistiques déjà affichées, et pas les autres
						statistiques.appendChild(newStat);
						
						var newLabel = document.createElement('a');
						newLabel.setAttribute("class","stats_a");
						newLabel.setAttribute("href","#");
						newLabel.setAttribute("onclick","infoStat('"+fonction+"');"+fonction+"(); return false;");
						newLabel.textContent = nom;
						statistiques.appendChild(newLabel);
					}
				}
			}
			
			
			
			
			
			
			
			
// Fonctions internes
			
			
		// Affichage des informations concernant la statistique
		
		
			// fonction qui affiche la fenêtre d'informations concernant la statistique
			function infoStat(fonction) {
				
				// récupère la fonction de la statistique pour mettre à jour le bouton d'actualisation de la carte d'autocorrélation spatiale
				var refreshButton = document.getElementById('stats_Statistiques_section_ville_refresh');
				refreshButton.setAttribute("onclick",fonction+"(); return false;");
				
				
				// récupère les informations concernant la statistique
				
				var nom = ""; // nom de la statistique
				var informations = ""; // informations concernant la statistique
				
				for (istat of stats){
					if (fonction == istat.fonction) {
						nom = istat.nom;
						informations = istat.infos;
					}
				}
				
				
				// remplace le contenu de la case "infos" par la fenêtre d'informations concernant la statistique
				
				var infos = document.getElementById('stats_Statistiques_infos');
				
				infos.innerHTML = ""; // vide le contenu de la case "infos"
				
				var Stat = document.createElement('p');
				Stat.setAttribute("id","stats_Statistiques_infos_stat_nom");
				Stat.textContent = nom + " :";
				infos.appendChild(Stat);
				
				var myStat = document.createElement('p');
				myStat.setAttribute("id","stats_Statistiques_infos_stat_infos");
				myStat.textContent = informations;
				infos.appendChild(myStat);
			}








// Affichage de la carte raster
		

		// Couleurs des différents carrés raster
			
/*			
			// différentes listes de couleurs pouvant être utilisées pour la cartographie statistique
			var liste_couleurs = ['lightyellow','yellow','orange','orangered','red','darkred'] // ensemble des couleurs utilisées pour les statistiques (du plus clair au plus foncé)
			
			
			// intervalles de coueleurs de la carte
			var debut_couleurs = 0.1; // valeur à partir de laquelle les carrés possèdent des couleurs
			var pas_couleurs = 0.1; // longueur de chaque intervalle de couleur de la carte raster
			
			
			// fonction qui renvoie la couleur de l'élement selon les paramètres choisis (début et pas de l'intervalle de couleurs)
			function attribuerCouleurs(valeur) {
				
				// couleur blanche pour les attributs en-dessous de l'intervalle
				if (valeur < debut_couleurs)
					return 'white';
					
				else {
					
					// parcours la liste de couleur pour trouvé la couleur associée à la valeur en paramètre
					for (var k = 0; k < liste_couleurs.length; k++) {
						if (valeur < debut_couleurs + (k+1)*pas_couleurs)
							return liste_couleurs[k];
					}
					
					// couleur noire pour les attributs au-dessus de l'intervalle de recherche
					return 'black';
				}
			}
*/


			// Gamme et nombre de couleurs (ou de classes)
			var gamme_couleurs = "BuRd";
			var nombre_couleurs = 5; // compris entre 3 et 9
			
			
			
			// Affichage de la fenêtre d'informations
			var infos_test = 0;




		// Liste raster de la statistique
			
			
			// classe qui crée pour chaque carré la moyenne des valeurs (de l'élément mesuré) dans le carré
			class Element {
				
				constructor(nombre, somme_valeurs) {
					
					this.nombre = nombre; // nombre d'adresses dans le carré
					this.somme_valeurs = somme_valeurs; // somme des valeurs (de l'élément mesuré) des différentes adresses dans le carré
					
					// moyenne des valeurs (de l'élément mesuré) des différentes adresses dans le carré
					if (nombre > 0) this.moyenne = somme_valeurs / nombre;
					else this.moyenne = 0;
				}
			}
			
				
				
			// fonction qui initialise une nouvelle liste raster vide
			function initialiserListe() {
				
				var L = [];
				
				for (var a = 0; a < a_max; a++) {
					
					var L_a = [];
					var element_nul = new Element(0,0);
					
					for (var b = 0; b < b_max; b++) {
						L_a.push(element_nul);
					}
					
					L.push(L_a);
				}
				
				return L;
			}


			
			
		// Liste raster d'autocorrélation spatiale
		
			
			var nombre_voisins = 5; // nombre de "cercles" de voisins à prendre en compte dans l'autocorrélation spatiale
			var poids_voisins = [0,5,4,3,2,1]; // poids de chaque "cercle" de voisin (ATTENTION : poids_voisins.length == nombre_voisins + 1 !!!)
			
			
			
			// fonction qui crée une liste raster d'autocorrélation spatiale à partir d'une liste de valeurs statistiques (LISA à partir de l'indice de Moran)
			function autocorrelationMoran(L) {
			
				var L_corr = initialiserListeCorr();
				
				var infos_stats = calculerMoyenne(L);
				var moyenne = infos_stats[0]; // moyenne de la statistique par carré
				var nombre_valeurs = infos_stats[1]; // nombre de valeurs de statistique
				
				var variance = calculerVariance(L, moyenne, nombre_valeurs); // variance de la statistique multipliée par le nombre de valeurs
				var ponderation = calculerPonderation(L); // somme de tous les termes de la matrice de pondération
				
				var Imoran = 0; // indice de Moran global
				
				var I = 0; // indice de Moran local (LISA)
				var valeur = 0; // valeur d'un carré
				var voisin = 0; // valeur d'un des voisins
				
				for (var a = nombre_voisins; a < a_max - nombre_voisins; a++) {
				
					for (var b = nombre_voisins; b < b_max - nombre_voisins; b++) {
						
						// informations du carré concernant l'élément mesuré
						var carre = L[a][b];
						
						// prend uniquement en compte ceux possédant une valeur
						if (carre.nombre > 0) {
							
							I = 0;
							valeur = carre.moyenne;
						
							for (var k = 1; k <= nombre_voisins; k++) {
								
								for (var x = a-k; x <= a+k; x++) {
									
									voisin = L[x][b-k].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - moyenne);
									
									voisin = L[x][b+k].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - moyenne);
								}
								
								for (var y = b-k+1; y <= b+k-1; y++) {
									
									voisin = L[a-k][y].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - moyenne);
									
									voisin = L[a+k][y].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - moyenne);
								}
							}
							
							I = (valeur - moyenne) * I / ponderation / variance;
							
							L_corr[a].splice(b, 1, I); // modifie les données du carré raster où se trouve l'adresse
							
							Imoran += I;
						}
					}
				}
				
				alert("Indice de Moran global : " + Imoran.toFixed(3));
				
				return L_corr;
			}
			
			
			
			// fonction qui crée une liste raster d'autocorrélation spatiale à partir d'une liste de valeurs statistiques (LISA à partir de l'indice de Geary)
			function autocorrelationGeary(L) {
			
				var L_corr = initialiserListeCorr();
				
				var infos_stats = calculerMoyenne(L);
				var moyenne = infos_stats[0]; // moyenne de la statistique par carré
				var nombre_valeurs = infos_stats[1]; // nombre de valeurs de statistique
				
				var variance = calculerVariance(L, moyenne, nombre_valeurs); // variance de la statistique multipliée par le nombre de valeurs
				var ponderation = calculerPonderation(L); // somme de tous les termes de la matrice de pondération
				
				var Igeary = 0; // indice de Geary global
				
				var I = 0; // indice de Geary local (LISA)
				var valeur = 0; // valeur d'un carré
				var voisin = 0; // valeur d'un de ses voisins
				
				for (var a = nombre_voisins; a < a_max - nombre_voisins; a++) {
				
					for (var b = nombre_voisins; b < b_max - nombre_voisins; b++) {
						
						// informations du carré concernant l'élément mesuré
						var carre = L[a][b];
						
						// prend uniquement en compte ceux possédant une valeur
						if (carre.nombre > 0) {
							
							I = 0;
							valeur = carre.moyenne;
						
							for (var k = 1; k <= nombre_voisins; k++) {
								
								for (var x = a-k; x <= a+k; x++) {
									
									voisin = L[x][b-k].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - valeur)**2;
									
									voisin = L[x][b+k].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - valeur)**2;
								}
								
								for (var y = b-k+1; y <= b+k-1; y++) {
									
									voisin = L[a-k][y].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - valeur)**2;
									
									voisin = L[a+k][y].moyenne;
									if (voisin > 0)
										I += poids_voisins[k]*(voisin - valeur)**2;
								}
							}
							
							I = I / ponderation / variance;
							
							L_corr[a].splice(b, 1, I); // modifie les données du carré raster où se trouve l'adresse
							
							Igeary += I;
						}
					}
				}
				
				Igeary = Igeary * (nombre_valeurs - 1) / 2 / nombre_valeurs;
				
				alert("Indice de Geary global : " + Igeary.toFixed(3));
				
				return L_corr;
			}
			
				
				
			// fonction qui initialise une nouvelle liste raster vide d'autocorrélation spatiale
			function initialiserListeCorr() {
				
				var L = [];
				
				for (var a = 0; a < a_max; a++) {
					
					var L_a = [];
					
					for (var b = 0; b < b_max; b++) {
						L_a.push(0);
					}
					
					L.push(L_a);
				}
				
				return L;
			}
			
			
			
			// fonction qui calcule la moyenne de la statistique par carré (prend uniquement en compte ceux possédant une valeur)
			function calculerMoyenne(L) {
				
				var ans = [];
				
				var moyenne = new Element(0, 0);
				
				for (var a = 0; a < a_max; a++) {
				
					for (var b = 0; b < b_max; b++) {
						
						// informations du carré concernant l'élément mesuré
						var carre = L[a][b];
						
						// prend uniquement en compte ceux possédant une valeur
						if (carre.nombre > 0) {
							moyenne.nombre += 1;
							moyenne.somme_valeurs += carre.moyenne;
						}
					}
				}
				
				ans.push(moyenne.somme_valeurs / moyenne.nombre);
				ans.push(moyenne.nombre);
				
				return ans;
			}
			
			
			
			// fonction qui calcule la variance de la statistique par carré multipliée par le nombre de valeurs
			function calculerVariance(L, moyenne, nombre_valeurs) {
			
				var variance = 0;
				
				for (var a = nombre_voisins; a < a_max - nombre_voisins; a++) {
				
					for (var b = nombre_voisins; b < b_max - nombre_voisins; b++) {
						
						// informations du carré concernant l'élément mesuré
						var carre = L[a][b];
						
						// prend uniquement en compte ceux possédant une valeur
						if (carre.nombre > 0) {
							variance += (carre.moyenne - moyenne)**2;
						}
					}
				}
				
				variance = variance / nombre_valeurs;
				
				return variance;
			}
			
			
			
			// fonction qui calcule la somme de tous les termes de la matrice de pondération
			function calculerPonderation(L) {
			
				var ponderation = 0;
				
				for (var a = nombre_voisins; a < a_max - nombre_voisins; a++) {
				
					for (var b = nombre_voisins; b < b_max - nombre_voisins; b++) {
						
						for (var k = 1; k <= nombre_voisins; k++) {
								
								for (var x = a-k; x <= a+k; x++) {
									
									if (L[x][b-k].moyenne)
										ponderation += poids_voisins[k];
									
									if (L[x][b+k].moyenne > 0)
										ponderation += poids_voisins[k];
								}
								
								for (var y = b-k+1; y <= b+k-1; y++) {
									
									if (L[a-k][y].moyenne > 0)
										ponderation += poids_voisins[k];
									
									if (L[a+k][y].moyenne > 0)
										ponderation += poids_voisins[k];
								}
							}
					}
				}
				
				return ponderation;
			}
			
			
			
			
		// Affichage de la carte raster, de sa légende et des informations concernant la statistique
		
		
			// fonction qui affiche la carte avec le zoom initial
			function afficherCarte() {
				
				// enlève les éléments actuels de l'affichage de la carte
				mapStats.clearLayers();
				mapMarkers.clearLayers();
				
				ajusterCarte(); // ajuste le zoom à l'ensemble des adresses
			}
			
			
			
			// fonction qui crée sur la carte des carrés dont la couleur dépend de la valeur attribuée au carré
			function afficherStat(liste) {
				
				var liste_brew = creerBrew(liste); // crée une liste à une dimension avec le tableau à 2 dimensions de la carte raster (valeur moyenne de chaque carré)
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur
				var brew = new classyBrew();
				brew.setSeries(liste_brew);
				brew.setNumClasses(nombre_couleurs); // nombre de couleurs différentes
				brew.setColorCode(gamme_couleurs); // gamme des couleurs
				brew.classify("jenks"); // méthode de répartition des couleurs : 'jenks' (nombre identique de valeurs dans chaque intervalle de couleur)
				
				/* La méthode d'optimisation de Jenks est une méthode de regroupement de données conçue pour déterminer le meilleur agencement des valeurs dans différentes classes, en cherchant à minimiser l’écart moyen de chaque classe
				par rapport à la moyenne de la classe, tout en maximisant l’écart de chaque classe par rapport à la moyenne des autres groupes (réduire la variance au sein des classes et maximiser la variance entre les classes). */


				for (var a = 0; a < a_max; a++) {
				
					for (var b = 0; b < b_max; b++) {
						
						// indice de Moran local pour le carré
						var I = liste[a][b];
						
						// crée un carré coloré uniquement si l'indice est différent de 0 (ATTENTION il peut être < 0 !!!!)
						if (I != 0) {
						
							// couleur du carré en fonction du nombre de caractères moyens dans le nom de rue des adresses du carré
							/*var couleur = attribuerCouleurs(I);*/
							var couleur = brew.getColorInRange(I);
						
							// coordonnées du carré
							var x = lat_minC + a* lat_pasC;
							var y = lon_minC + b* lon_pasC;
						
							// crée les extrémités du carré
							var c1 = L.latLng(x, y);
							var c2 = L.latLng(x, y + lon_pasC);
							var c3 = L.latLng(x + lat_pasC, y + lon_pasC);
							var c4 = L.latLng(x + lat_pasC, y);
				
							// créer un polygône à partir de ces adresses
							L.polygon([c1,c2,c3,c4],{
								color: couleur,
								fillColor: couleur,
								fillOpacity: 1
							}).addTo(mapStats);
						}
					}
				}
				
				
				afficherLegende(brew); // affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster
			}
			
			
			
			// fonction qui crée une liste à une dimension des valeurs moyennes de chaque carré (comprenant seulement les carrés possédant une valeur)
			function creerBrew(liste) {
				
				var L = [];
				
				for (var x=0; x<liste.length; x++) {
					var L_x = liste[x];
					for (var y=0; y<L_x.length ; y++) {
						var I = L_x[y];
						if (I != 0)
							L.push(I);
					}
				}
				
				return L;
			}
			
			
/*			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster
			function afficherLegende() {
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","legende");
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h5');
				myLegend.textContent = "I de moran local";
				Legend.appendChild(myLegend);
				
				// couleur blanche pour les valeurs inférieures à l'intervalle de couleurs
				var White = document.createElement('div');
				White.setAttribute("class","ligne");
				var myWhite = document.createElement('div');
				myWhite.setAttribute("class","couleur");
				myWhite.setAttribute("style","background-color:white;");
				White.appendChild(myWhite);
				var myWhiteText = document.createElement('span');
				var finWhite = debut_couleurs.toFixed(1);
				myWhiteText.textContent = "< " + finWhite;
				White.appendChild(myWhiteText);
				Legend.appendChild(White);
				
				// couleur pour chaque valeur de l'intervalle de couleurs
				for (var k = 0; k < liste_couleurs.length; k++) {
					var Color = document.createElement('div');
					Color.setAttribute("class","ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","couleur");
					var couleur = liste_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					var myColorText = document.createElement('span');
					var debutColor = (debut_couleurs + k* pas_couleurs).toFixed(1);
					var finColor = (debut_couleurs + (k+1)* pas_couleurs).toFixed(1);
					myColorText.textContent = debutColor + " à " + finColor;
					Color.appendChild(myColorText);
					Legend.appendChild(Color);
				}
				
				// couleur noire pour les valeurs supérieures à l'intervalle de couleurs
				var Black = document.createElement('div');
				Black.setAttribute("class","ligne");
				var myBlack = document.createElement('div');
				myBlack.setAttribute("class","couleur");
				myBlack.setAttribute("style","background-color:black;");
				Black.appendChild(myBlack);
				var myBlackText = document.createElement('span');
				var debutBlack = (debut_couleurs + liste_couleurs.length * pas_couleurs).toFixed(1);
				myBlackText.textContent = "> " + debutBlack;
				Black.appendChild(myBlackText);
				Legend.appendChild(Black);
				
				document.body.appendChild(Legend);
			}
*/


			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte raster
			function afficherLegende(brew) {
				
				// crée la case 'légende'
				var Legend = document.createElement('div');
				Legend.setAttribute("id","stats_Statistiques_legende");
				
				// ajoute le titre à la case 'légende'
				var myLegend = document.createElement('h2');
				myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				myLegend.textContent = "I de Moran local";
				//myLegend.textContent = "I de Geary local";
				Legend.appendChild(myLegend);
					
					
				// liste des couleurs et de leurs valeurs associées
				var liste_valeurs = brew.getBreaks();
				var liste_couleurs = brew.getColors();
				
				
				// définit la dernière décimale importante des valeurs
				var nombre_decimales = calculerDecimale(liste_valeurs);
				
				
				// couleur pour chaque valeur de l'intervalle de couleurs
				for (var k = 0; k < nombre_couleurs; k++) {
					
					// valeur limite d'un intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_valeurs[k].toFixed(nombre_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
					
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
				}
				
				// ajout de la dernière valeur
				var Value = document.createElement('div');
				Value.setAttribute("class","stats_Statistiques_legende_ligne");
				var myValue = document.createElement('span');
				myValue.setAttribute("class","stats_Statistiques_legende_valeur");
				myValue.textContent = liste_valeurs[nombre_couleurs].toFixed(nombre_decimales);
				Value.appendChild(myValue);
				Legend.appendChild(Value);
				
				// ajout du bouton d'informations
				var Button = document.createElement('a');
				Button.setAttribute("class","stats_a");
				Button.setAttribute("href","#");
				Button.setAttribute("onclick","afficherInformations(); return false;");
				var myButton = document.createElement('img');
				myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				myButton.setAttribute("src","../images/informations.jpg");
				myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				Button.appendChild(myButton);
				Legend.appendChild(Button);
				
				document.body.appendChild(Legend);
			}
			
			
			
			// fonction qui calcule la dernière décimale importante des valeurs
			function calculerDecimale(liste) {
				
				var decimale = 0;
				
				for (var k=1; k<liste.length; k++) {
					
					var intervalle = liste[k] - liste[k-1];
					
					if (intervalle > 0) {
						var decimale_intervalle = 0;
						while(intervalle * 10**decimale_intervalle < 1)
							decimale_intervalle ++;
						if (decimale_intervalle > decimale)
							decimale = decimale_intervalle;
					}
				}
				
				return Math.min(3,decimale);
			}
			
			
			
			// fonction qui supprime la légende existante, s'il y en a une
			function effacerLegende() {
				if (document.getElementById('legende')) {
					var legende = document.getElementById('legende');
					document.body.removeChild(legende);
				}
			}
			
			
			
			// fonction qui affiche/efface la fenêtre d'informations sur l'indice de Moran local, au clic sur le bouton d'informations
			function afficherInformations() {
				
				if (infos_test == 0) {
					
					var Infos = document.createElement('div');
					Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					var myInfos1 = document.createElement('p');
					myInfos1.textContent = "I > 0 indique un regroupement de valeurs similaires (plus élevées ou plus faibles que la moyenne)."
					Infos.appendChild(myInfos1);
					
					var myInfos2 = document.createElement('p');
					myInfos2.textContent = "I < 0 indique un regroupement de valeurs dissimilaires (par exemple des valeurs élevées entourées de valeurs faibles)."
					Infos.appendChild(myInfos2);
					
					document.body.appendChild(Infos);
					
					infos_test = 1;
				}
				
				else {
					
					var Infos = document.getElementById('stats_Statistiques_legende_infos');
					document.body.removeChild(Infos);
					
					infos_test = 0;
				}
			}
			
			
			
			
		
		
		
		
// Fonctions d'analyse spatiale


		// Fonction associée à la statistique 'Nombre moyen de lettres par adresse'
		
		
			// fonction qui affiche une représentation du nombre de lettres dans chaque adresse
			function stats_lettres() {
				coordLimites(); // récupère les coordonnées limites de la carte
				afficherCarte(); // affiche la carte avec le zoom initial
				effacerLegende(); // supprime la légende existante, s'il y en a une
				var L = nombreLettres(); // crée une carte raster pour la statistique
				var L_corr = autocorrelationMoran(L); // crée la carte d'autocorrélation qui en découle (indice de Moran local)
				//var L_corr = autocorrelationGeary(L); // crée la carte d'autocorrélation qui en découle (indice de Geary local)
				afficherStat(L_corr); // affiche la carte raster
				/*afficherLegende(); // affiche la sa légende*/
			}
			
			
			
			// fonction qui renvoie une liste donnant le nombre de lettre par adresse
			function nombreLettres() {
				
				var rue = ""; // nom de la rue de la i-ème adresse de la BDD
				var rue_split = ""; // tous les caractères du nom de la i-ème rue sont séparés 1 à 1
				var rue_length = ""; // nombre de caractères dans le nom de la i-ème rue
				
				var L = initialiserListe(); // crée une liste raster vide
				
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					
					var latitude = BDD_adresses[i].latitude;
					var lat_carre = Math.floor((latitude - lat_minC) / lat_pasC); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = BDD_adresses[i].longitude;
					var lon_carre = Math.floor((longitude - lon_minC) / lon_pasC); // ordonnée du carré raster où se trouve l'adresse
					
					rue = BDD_adresses[i].rue;
					rue_split = rue.split("");
					rue_length = rue_split.length; // nombre de caractères dans le nom de rue de l'adresse
				
					// modifie les données du carré raster où se trouve l'adresse
					var new_nombre = L[lat_carre][lon_carre].nombre + 1;
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + rue_length;
					var new_carre= new Element(new_nombre, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}
				
				
				return L;
			}
			
			
			
			
		// Fonction associée à la statistique 'Nombre d'adresses'
		
		
			// fonction qui affiche une représentation du nombre d'adresses par carré
			function stats_nombre() {
				coordLimites(); // récupère les coordonnées limites de la carte
				afficherCarte(); // affiche la carte avec le zoom initial
				effacerLegende(); // supprime la légende existante, s'il y en a une
				var L = nombreAdresses(); // crée une carte raster pour la statistique
				//var L_corr = autocorrelationMoran(L); // crée la carte d'autocorrélation qui en découle (indice de Moran local)
				var L_corr = autocorrelationGeary(L); // crée la carte d'autocorrélation qui en découle (indice de Geary local)
				afficherStat(L_corr); // affiche la carte raster
				/*afficherLegende(); // affiche la sa légende*/
			}
			
			
			// fonction qui renvoie une liste donnant le nombre d'adresses par carré
			function nombreAdresses() {
				
				var L = initialiserListe();
				
				for (var i=ville_debut; i<=ville_fin; i++) {
					
					var latitude = BDD_adresses[i].latitude;
					var lat_carre = Math.floor((latitude - lat_minC) / lat_pasC); // abscisse du carré raster où se trouve l'adresse
					
					var longitude = BDD_adresses[i].longitude;
					var lon_carre = Math.floor((longitude - lon_minC) / lon_pasC); // ordonnée du carré raster où se trouve l'adresse
					
					// modifie les données du carré raster où se trouve l'adresse
					var new_somme_valeurs = L[lat_carre][lon_carre].somme_valeurs + 1;
					var new_carre= new Element(1, new_somme_valeurs);
					L[lat_carre].splice(lon_carre, 1, new_carre);
				}
				
				return L;
			}








// Fichier javascript de la librairie classyBrew (https://github.com/tannerjt/classybrew/tree/master/src)

			
			(function () {

			var classyBrew = (function () {

				return function () {
					this.series = undefined;
					this.numClasses = null;
					this.breaks = undefined;
					this.colorCode = undefined;
					this.range = undefined;
					this.statMethod = undefined;

					this.colorSchemes = {
						/** Sequential **/
						OrRd:  {3: ['rgb(254,232,200)', 'rgb(253,187,132)', 'rgb(227,74,51)'], 4: ['rgb(254,240,217)', 'rgb(253,204,138)', 'rgb(252,141,89)', 'rgb(215,48,31)'], 5: ['rgb(254,240,217)', 'rgb(253,204,138)', 'rgb(252,141,89)', 'rgb(227,74,51)', 'rgb(179,0,0)'], 6: ['rgb(254,240,217)', 'rgb(253,212,158)', 'rgb(253,187,132)', 'rgb(252,141,89)', 'rgb(227,74,51)', 'rgb(179,0,0)'], 7: ['rgb(254,240,217)', 'rgb(253,212,158)', 'rgb(253,187,132)', 'rgb(252,141,89)', 'rgb(239,101,72)', 'rgb(215,48,31)', 'rgb(153,0,0)'], 8: ['rgb(255,247,236)', 'rgb(254,232,200)', 'rgb(253,212,158)', 'rgb(253,187,132)', 'rgb(252,141,89)', 'rgb(239,101,72)', 'rgb(215,48,31)', 'rgb(153,0,0)'], 9: ['rgb(255,247,236)', 'rgb(254,232,200)', 'rgb(253,212,158)', 'rgb(253,187,132)', 'rgb(252,141,89)', 'rgb(239,101,72)', 'rgb(215,48,31)', 'rgb(179,0,0)', 'rgb(127,0,0)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,0,0,0,0,0],'copy':[1,1,2,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						PuBu:  {3: ['rgb(236,231,242)', 'rgb(166,189,219)', 'rgb(43,140,190)'], 4: ['rgb(241,238,246)', 'rgb(189,201,225)', 'rgb(116,169,207)', 'rgb(5,112,176)'], 5: ['rgb(241,238,246)', 'rgb(189,201,225)', 'rgb(116,169,207)', 'rgb(43,140,190)', 'rgb(4,90,141)'], 6: ['rgb(241,238,246)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(43,140,190)', 'rgb(4,90,141)'], 7: ['rgb(241,238,246)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(54,144,192)', 'rgb(5,112,176)', 'rgb(3,78,123)'], 8: ['rgb(255,247,251)', 'rgb(236,231,242)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(54,144,192)', 'rgb(5,112,176)', 'rgb(3,78,123)'], 9: ['rgb(255,247,251)', 'rgb(236,231,242)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(116,169,207)', 'rgb(54,144,192)', 'rgb(5,112,176)', 'rgb(4,90,141)', 'rgb(2,56,88)'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,2,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,2,0,0,0,0] } } ,
						BuPu:  {3: ['rgb(224,236,244)', 'rgb(158,188,218)', 'rgb(136,86,167)'], 4: ['rgb(237,248,251)', 'rgb(179,205,227)', 'rgb(140,150,198)', 'rgb(136,65,157)'], 5: ['rgb(237,248,251)', 'rgb(179,205,227)', 'rgb(140,150,198)', 'rgb(136,86,167)', 'rgb(129,15,124)'], 6: ['rgb(237,248,251)', 'rgb(191,211,230)', 'rgb(158,188,218)', 'rgb(140,150,198)', 'rgb(136,86,167)', 'rgb(129,15,124)'], 7: ['rgb(237,248,251)', 'rgb(191,211,230)', 'rgb(158,188,218)', 'rgb(140,150,198)', 'rgb(140,107,177)', 'rgb(136,65,157)', 'rgb(110,1,107)'], 8: ['rgb(247,252,253)', 'rgb(224,236,244)', 'rgb(191,211,230)', 'rgb(158,188,218)', 'rgb(140,150,198)', 'rgb(140,107,177)', 'rgb(136,65,157)', 'rgb(110,1,107)'], 9: ['rgb(247,252,253)', 'rgb(224,236,244)', 'rgb(191,211,230)', 'rgb(158,188,218)', 'rgb(140,150,198)', 'rgb(140,107,177)', 'rgb(136,65,157)', 'rgb(129,15,124)', 'rgb(77,0,75)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,2,2,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						Oranges:  {3: ['rgb(254,230,206)', 'rgb(253,174,107)', 'rgb(230,85,13)'], 4: ['rgb(254,237,222)', 'rgb(253,190,133)', 'rgb(253,141,60)', 'rgb(217,71,1)'], 5: ['rgb(254,237,222)', 'rgb(253,190,133)', 'rgb(253,141,60)', 'rgb(230,85,13)', 'rgb(166,54,3)'], 6: ['rgb(254,237,222)', 'rgb(253,208,162)', 'rgb(253,174,107)', 'rgb(253,141,60)', 'rgb(230,85,13)', 'rgb(166,54,3)'], 7: ['rgb(254,237,222)', 'rgb(253,208,162)', 'rgb(253,174,107)', 'rgb(253,141,60)', 'rgb(241,105,19)', 'rgb(217,72,1)', 'rgb(140,45,4)'], 8: ['rgb(255,245,235)', 'rgb(254,230,206)', 'rgb(253,208,162)', 'rgb(253,174,107)', 'rgb(253,141,60)', 'rgb(241,105,19)', 'rgb(217,72,1)', 'rgb(140,45,4)'], 9: ['rgb(255,245,235)', 'rgb(254,230,206)', 'rgb(253,208,162)', 'rgb(253,174,107)', 'rgb(253,141,60)', 'rgb(241,105,19)', 'rgb(217,72,1)', 'rgb(166,54,3)', 'rgb(127,39,4)'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,0,0,0,0,0],'copy':[1,2,2,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						BuGn:  {3: ['rgb(229,245,249)', 'rgb(153,216,201)', 'rgb(44,162,95)'], 4: ['rgb(237,248,251)', 'rgb(178,226,226)', 'rgb(102,194,164)', 'rgb(35,139,69)'], 5: ['rgb(237,248,251)', 'rgb(178,226,226)', 'rgb(102,194,164)', 'rgb(44,162,95)', 'rgb(0,109,44)'], 6: ['rgb(237,248,251)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(44,162,95)', 'rgb(0,109,44)'], 7: ['rgb(237,248,251)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(65,174,118)', 'rgb(35,139,69)', 'rgb(0,88,36)'], 8: ['rgb(247,252,253)', 'rgb(229,245,249)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(65,174,118)', 'rgb(35,139,69)', 'rgb(0,88,36)'], 9: ['rgb(247,252,253)', 'rgb(229,245,249)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(65,174,118)', 'rgb(35,139,69)', 'rgb(0,109,44)', 'rgb(0,68,27)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,2,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						YlOrBr:  {3: ['rgb(255,247,188)', 'rgb(254,196,79)', 'rgb(217,95,14)'], 4: ['rgb(255,255,212)', 'rgb(254,217,142)', 'rgb(254,153,41)', 'rgb(204,76,2)'], 5: ['rgb(255,255,212)', 'rgb(254,217,142)', 'rgb(254,153,41)', 'rgb(217,95,14)', 'rgb(153,52,4)'], 6: ['rgb(255,255,212)', 'rgb(254,227,145)', 'rgb(254,196,79)', 'rgb(254,153,41)', 'rgb(217,95,14)', 'rgb(153,52,4)'], 7: ['rgb(255,255,212)', 'rgb(254,227,145)', 'rgb(254,196,79)', 'rgb(254,153,41)', 'rgb(236,112,20)', 'rgb(204,76,2)', 'rgb(140,45,4)'], 8: ['rgb(255,255,229)', 'rgb(255,247,188)', 'rgb(254,227,145)', 'rgb(254,196,79)', 'rgb(254,153,41)', 'rgb(236,112,20)', 'rgb(204,76,2)', 'rgb(140,45,4)'], 9: ['rgb(255,255,229)', 'rgb(255,247,188)', 'rgb(254,227,145)', 'rgb(254,196,79)', 'rgb(254,153,41)', 'rgb(236,112,20)', 'rgb(204,76,2)', 'rgb(153,52,4)', 'rgb(102,37,6)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,2,0,0,0,0],'copy':[1,2,2,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						YlGn:  {3: ['rgb(247,252,185)', 'rgb(173,221,142)', 'rgb(49,163,84)'], 4: ['rgb(255,255,204)', 'rgb(194,230,153)', 'rgb(120,198,121)', 'rgb(35,132,67)'], 5: ['rgb(255,255,204)', 'rgb(194,230,153)', 'rgb(120,198,121)', 'rgb(49,163,84)', 'rgb(0,104,55)'], 6: ['rgb(255,255,204)', 'rgb(217,240,163)', 'rgb(173,221,142)', 'rgb(120,198,121)', 'rgb(49,163,84)', 'rgb(0,104,55)'], 7: ['rgb(255,255,204)', 'rgb(217,240,163)', 'rgb(173,221,142)', 'rgb(120,198,121)', 'rgb(65,171,93)', 'rgb(35,132,67)', 'rgb(0,90,50)'], 8: ['rgb(255,255,229)', 'rgb(247,252,185)', 'rgb(217,240,163)', 'rgb(173,221,142)', 'rgb(120,198,121)', 'rgb(65,171,93)', 'rgb(35,132,67)', 'rgb(0,90,50)'], 9: ['rgb(255,255,229)', 'rgb(247,252,185)', 'rgb(217,240,163)', 'rgb(173,221,142)', 'rgb(120,198,121)', 'rgb(65,171,93)', 'rgb(35,132,67)', 'rgb(0,104,55)', 'rgb(0,69,41)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,1,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						Reds:  {3: ['rgb(254,224,210)', 'rgb(252,146,114)', 'rgb(222,45,38)'], 4: ['rgb(254,229,217)', 'rgb(252,174,145)', 'rgb(251,106,74)', 'rgb(203,24,29)'], 5: ['rgb(254,229,217)', 'rgb(252,174,145)', 'rgb(251,106,74)', 'rgb(222,45,38)', 'rgb(165,15,21)'], 6: ['rgb(254,229,217)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(222,45,38)', 'rgb(165,15,21)'], 7: ['rgb(254,229,217)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 'rgb(203,24,29)', 'rgb(153,0,13)'], 8: ['rgb(255,245,240)', 'rgb(254,224,210)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 'rgb(203,24,29)', 'rgb(153,0,13)'], 9: ['rgb(255,245,240)', 'rgb(254,224,210)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 'rgb(203,24,29)', 'rgb(165,15,21)', 'rgb(103,0,13)'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,2,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						RdPu:  {3: ['rgb(253,224,221)', 'rgb(250,159,181)', 'rgb(197,27,138)'], 4: ['rgb(254,235,226)', 'rgb(251,180,185)', 'rgb(247,104,161)', 'rgb(174,1,126)'], 5: ['rgb(254,235,226)', 'rgb(251,180,185)', 'rgb(247,104,161)', 'rgb(197,27,138)', 'rgb(122,1,119)'], 6: ['rgb(254,235,226)', 'rgb(252,197,192)', 'rgb(250,159,181)', 'rgb(247,104,161)', 'rgb(197,27,138)', 'rgb(122,1,119)'], 7: ['rgb(254,235,226)', 'rgb(252,197,192)', 'rgb(250,159,181)', 'rgb(247,104,161)', 'rgb(221,52,151)', 'rgb(174,1,126)', 'rgb(122,1,119)'], 8: ['rgb(255,247,243)', 'rgb(253,224,221)', 'rgb(252,197,192)', 'rgb(250,159,181)', 'rgb(247,104,161)', 'rgb(221,52,151)', 'rgb(174,1,126)', 'rgb(122,1,119)'], 9: ['rgb(255,247,243)', 'rgb(253,224,221)', 'rgb(252,197,192)', 'rgb(250,159,181)', 'rgb(247,104,161)', 'rgb(221,52,151)', 'rgb(174,1,126)', 'rgb(122,1,119)', 'rgb(73,0,106)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,1,2,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						Greens:  {3: ['rgb(229,245,224)', 'rgb(161,217,155)', 'rgb(49,163,84)'], 4: ['rgb(237,248,233)', 'rgb(186,228,179)', 'rgb(116,196,118)', 'rgb(35,139,69)'], 5: ['rgb(237,248,233)', 'rgb(186,228,179)', 'rgb(116,196,118)', 'rgb(49,163,84)', 'rgb(0,109,44)'], 6: ['rgb(237,248,233)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(49,163,84)', 'rgb(0,109,44)'], 7: ['rgb(237,248,233)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(65,171,93)', 'rgb(35,139,69)', 'rgb(0,90,50)'], 8: ['rgb(247,252,245)', 'rgb(229,245,224)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(65,171,93)', 'rgb(35,139,69)', 'rgb(0,90,50)'], 9: ['rgb(247,252,245)', 'rgb(229,245,224)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(65,171,93)', 'rgb(35,139,69)', 'rgb(0,109,44)', 'rgb(0,68,27)'], 'properties':{'type': 'seq','blind':[1],'print':[1,0,0,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						YlGnBu:  {3: ['rgb(237,248,177)', 'rgb(127,205,187)', 'rgb(44,127,184)'], 4: ['rgb(255,255,204)', 'rgb(161,218,180)', 'rgb(65,182,196)', 'rgb(34,94,168)'], 5: ['rgb(255,255,204)', 'rgb(161,218,180)', 'rgb(65,182,196)', 'rgb(44,127,184)', 'rgb(37,52,148)'], 6: ['rgb(255,255,204)', 'rgb(199,233,180)', 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(44,127,184)', 'rgb(37,52,148)'], 7: ['rgb(255,255,204)', 'rgb(199,233,180)', 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(29,145,192)', 'rgb(34,94,168)', 'rgb(12,44,132)'], 8: ['rgb(255,255,217)', 'rgb(237,248,177)', 'rgb(199,233,180)', 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(29,145,192)', 'rgb(34,94,168)', 'rgb(12,44,132)'], 9: ['rgb(255,255,217)', 'rgb(237,248,177)', 'rgb(199,233,180)', 'rgb(127,205,187)', 'rgb(65,182,196)', 'rgb(29,145,192)', 'rgb(34,94,168)', 'rgb(37,52,148)', 'rgb(8,29,88)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,1,2,2,2,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,2,0,0,0,0] } } ,
						Purples:  {3: ['rgb(239,237,245)', 'rgb(188,189,220)', 'rgb(117,107,177)'], 4: ['rgb(242,240,247)', 'rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(106,81,163)'], 5: ['rgb(242,240,247)', 'rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(117,107,177)', 'rgb(84,39,143)'], 6: ['rgb(242,240,247)', 'rgb(218,218,235)', 'rgb(188,189,220)', 'rgb(158,154,200)', 'rgb(117,107,177)', 'rgb(84,39,143)'], 7: ['rgb(242,240,247)', 'rgb(218,218,235)', 'rgb(188,189,220)', 'rgb(158,154,200)', 'rgb(128,125,186)', 'rgb(106,81,163)', 'rgb(74,20,134)'], 8: ['rgb(252,251,253)', 'rgb(239,237,245)', 'rgb(218,218,235)', 'rgb(188,189,220)', 'rgb(158,154,200)', 'rgb(128,125,186)', 'rgb(106,81,163)', 'rgb(74,20,134)'], 9: ['rgb(252,251,253)', 'rgb(239,237,245)', 'rgb(218,218,235)', 'rgb(188,189,220)', 'rgb(158,154,200)', 'rgb(128,125,186)', 'rgb(106,81,163)', 'rgb(84,39,143)', 'rgb(63,0,125)'], 'properties':{'type': 'seq','blind':[1],'print':[1,0,0,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,0,0,0,0,0,0] } } ,
						GnBu:  {3: ['rgb(224,243,219)', 'rgb(168,221,181)', 'rgb(67,162,202)'], 4: ['rgb(240,249,232)', 'rgb(186,228,188)', 'rgb(123,204,196)', 'rgb(43,140,190)'], 5: ['rgb(240,249,232)', 'rgb(186,228,188)', 'rgb(123,204,196)', 'rgb(67,162,202)', 'rgb(8,104,172)'], 6: ['rgb(240,249,232)', 'rgb(204,235,197)', 'rgb(168,221,181)', 'rgb(123,204,196)', 'rgb(67,162,202)', 'rgb(8,104,172)'], 7: ['rgb(240,249,232)', 'rgb(204,235,197)', 'rgb(168,221,181)', 'rgb(123,204,196)', 'rgb(78,179,211)', 'rgb(43,140,190)', 'rgb(8,88,158)'], 8: ['rgb(247,252,240)', 'rgb(224,243,219)', 'rgb(204,235,197)', 'rgb(168,221,181)', 'rgb(123,204,196)', 'rgb(78,179,211)', 'rgb(43,140,190)', 'rgb(8,88,158)'], 9: ['rgb(247,252,240)', 'rgb(224,243,219)', 'rgb(204,235,197)', 'rgb(168,221,181)', 'rgb(123,204,196)', 'rgb(78,179,211)', 'rgb(43,140,190)', 'rgb(8,104,172)', 'rgb(8,64,129)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,1,2,2,2,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,2,0,0,0,0] } } ,
						Greys:  {3: ['rgb(240,240,240)', 'rgb(189,189,189)', 'rgb(99,99,99)'], 4: ['rgb(247,247,247)', 'rgb(204,204,204)', 'rgb(150,150,150)', 'rgb(82,82,82)'], 5: ['rgb(247,247,247)', 'rgb(204,204,204)', 'rgb(150,150,150)', 'rgb(99,99,99)', 'rgb(37,37,37)'], 6: ['rgb(247,247,247)', 'rgb(217,217,217)', 'rgb(189,189,189)', 'rgb(150,150,150)', 'rgb(99,99,99)', 'rgb(37,37,37)'], 7: ['rgb(247,247,247)', 'rgb(217,217,217)', 'rgb(189,189,189)', 'rgb(150,150,150)', 'rgb(115,115,115)', 'rgb(82,82,82)', 'rgb(37,37,37)'], 8: ['rgb(255,255,255)', 'rgb(240,240,240)', 'rgb(217,217,217)', 'rgb(189,189,189)', 'rgb(150,150,150)', 'rgb(115,115,115)', 'rgb(82,82,82)', 'rgb(37,37,37)'], 9: ['rgb(255,255,255)', 'rgb(240,240,240)', 'rgb(217,217,217)', 'rgb(189,189,189)', 'rgb(150,150,150)', 'rgb(115,115,115)', 'rgb(82,82,82)', 'rgb(37,37,37)', 'rgb(0,0,0)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,2,0,0,0,0],'copy':[1,0,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						YlOrRd:  {3: ['rgb(255,237,160)', 'rgb(254,178,76)', 'rgb(240,59,32)'], 4: ['rgb(255,255,178)', 'rgb(254,204,92)', 'rgb(253,141,60)', 'rgb(227,26,28)'], 5: ['rgb(255,255,178)', 'rgb(254,204,92)', 'rgb(253,141,60)', 'rgb(240,59,32)', 'rgb(189,0,38)'], 6: ['rgb(255,255,178)', 'rgb(254,217,118)', 'rgb(254,178,76)', 'rgb(253,141,60)', 'rgb(240,59,32)', 'rgb(189,0,38)'], 7: ['rgb(255,255,178)', 'rgb(254,217,118)', 'rgb(254,178,76)', 'rgb(253,141,60)', 'rgb(252,78,42)', 'rgb(227,26,28)', 'rgb(177,0,38)'], 8: ['rgb(255,255,204)', 'rgb(255,237,160)', 'rgb(254,217,118)', 'rgb(254,178,76)', 'rgb(253,141,60)', 'rgb(252,78,42)', 'rgb(227,26,28)', 'rgb(177,0,38)'], 9:['rgb(255,255,204)','rgb(255,237,160)','rgb(254,217,118)','rgb(254,178,76)','rgb(253,141,60)','rgb(252,78,42)','rgb(227,26,28)','rgb(189,0,38)','rgb(128,0,38)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,2,2,0,0,0],'copy':[1,2,2,0,0,0,0],'screen':[1,2,2,0,0,0,0] } } ,
						PuRd:  {3: ['rgb(231,225,239)', 'rgb(201,148,199)', 'rgb(221,28,119)'], 4: ['rgb(241,238,246)', 'rgb(215,181,216)', 'rgb(223,101,176)', 'rgb(206,18,86)'], 5: ['rgb(241,238,246)', 'rgb(215,181,216)', 'rgb(223,101,176)', 'rgb(221,28,119)', 'rgb(152,0,67)'], 6: ['rgb(241,238,246)', 'rgb(212,185,218)', 'rgb(201,148,199)', 'rgb(223,101,176)', 'rgb(221,28,119)', 'rgb(152,0,67)'], 7: ['rgb(241,238,246)', 'rgb(212,185,218)', 'rgb(201,148,199)', 'rgb(223,101,176)', 'rgb(231,41,138)', 'rgb(206,18,86)', 'rgb(145,0,63)'], 8: ['rgb(247,244,249)', 'rgb(231,225,239)', 'rgb(212,185,218)', 'rgb(201,148,199)', 'rgb(223,101,176)', 'rgb(231,41,138)', 'rgb(206,18,86)', 'rgb(145,0,63)'], 9: ['rgb(247,244,249)', 'rgb(231,225,239)', 'rgb(212,185,218)', 'rgb(201,148,199)', 'rgb(223,101,176)', 'rgb(231,41,138)', 'rgb(206,18,86)', 'rgb(152,0,67)', 'rgb(103,0,31)'], 'properties':{'type': 'seq','blind':[1],'print':[1,1,1,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,1,0,0,0,0] } } ,
						Blues:  {3: ['rgb(222,235,247)', 'rgb(158,202,225)', 'rgb(49,130,189)'], 4: ['rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(33,113,181)'], 5: ['rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(49,130,189)', 'rgb(8,81,156)'], 6: ['rgb(239,243,255)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(49,130,189)', 'rgb(8,81,156)'], 7: ['rgb(239,243,255)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,69,148)'], 8: ['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,69,148)'], 9: ['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,0,0,0,0,0],'copy':[1,0,0,0,0,0,0],'screen':[1,2,0,0,0,0,0] } } ,
						PuBuGn:  {3: ['rgb(236,226,240)', 'rgb(166,189,219)', 'rgb(28,144,153)'], 4: ['rgb(246,239,247)', 'rgb(189,201,225)', 'rgb(103,169,207)', 'rgb(2,129,138)'], 5: ['rgb(246,239,247)', 'rgb(189,201,225)', 'rgb(103,169,207)', 'rgb(28,144,153)', 'rgb(1,108,89)'], 6: ['rgb(246,239,247)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(28,144,153)', 'rgb(1,108,89)'], 7: ['rgb(246,239,247)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(54,144,192)', 'rgb(2,129,138)', 'rgb(1,100,80)'], 8: ['rgb(255,247,251)', 'rgb(236,226,240)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(54,144,192)', 'rgb(2,129,138)', 'rgb(1,100,80)'], 9: ['rgb(255,247,251)', 'rgb(236,226,240)', 'rgb(208,209,230)', 'rgb(166,189,219)', 'rgb(103,169,207)', 'rgb(54,144,192)', 'rgb(2,129,138)', 'rgb(1,108,89)', 'rgb(1,70,54)'], 'properties':{'type': 'seq','blind':[1],'print':[1,2,2,0,0,0,0],'copy':[1,2,0,0,0,0,0],'screen':[1,1,2,0,0,0,0] } } ,
						/** Diverging **/
						Spectral:  {3: ['rgb(252,141,89)', 'rgb(255,255,191)', 'rgb(153,213,148)'], 4: ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(171,221,164)', 'rgb(43,131,186)'], 5: ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)', 'rgb(171,221,164)', 'rgb(43,131,186)'], 6: ['rgb(213,62,79)', 'rgb(252,141,89)', 'rgb(254,224,139)', 'rgb(230,245,152)', 'rgb(153,213,148)', 'rgb(50,136,189)'], 7: ['rgb(213,62,79)', 'rgb(252,141,89)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(230,245,152)', 'rgb(153,213,148)', 'rgb(50,136,189)'], 8: ['rgb(213,62,79)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(230,245,152)', 'rgb(171,221,164)', 'rgb(102,194,165)', 'rgb(50,136,189)'], 9: ['rgb(213,62,79)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(230,245,152)', 'rgb(171,221,164)', 'rgb(102,194,165)', 'rgb(50,136,189)'], 10: ['rgb(158,1,66)', 'rgb(213,62,79)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(230,245,152)', 'rgb(171,221,164)', 'rgb(102,194,165)', 'rgb(50,136,189)', 'rgb(94,79,162)'], 11: ['rgb(158,1,66)', 'rgb(213,62,79)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(230,245,152)', 'rgb(171,221,164)', 'rgb(102,194,165)', 'rgb(50,136,189)', 'rgb(94,79,162)'], 'properties':{'type': 'div', 'blind':[2,2,2,0,0,0,0,0,0],'print':[1,1,1,0,0,0,0,0,0],'copy':[1,1,1,0,0,0,0,0,0],'screen':[1,1,2,0,0,0,0,0,0] } } ,
						RdYlGn:  {3: ['rgb(252,141,89)', 'rgb(255,255,191)', 'rgb(145,207,96)'], 4: ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(166,217,106)', 'rgb(26,150,65)'], 5: ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)', 'rgb(166,217,106)', 'rgb(26,150,65)'], 6: ['rgb(215,48,39)', 'rgb(252,141,89)', 'rgb(254,224,139)', 'rgb(217,239,139)', 'rgb(145,207,96)', 'rgb(26,152,80)'], 7: ['rgb(215,48,39)', 'rgb(252,141,89)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(217,239,139)', 'rgb(145,207,96)', 'rgb(26,152,80)'], 8: ['rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(217,239,139)', 'rgb(166,217,106)', 'rgb(102,189,99)', 'rgb(26,152,80)'], 9: ['rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(217,239,139)', 'rgb(166,217,106)', 'rgb(102,189,99)', 'rgb(26,152,80)'], 10: ['rgb(165,0,38)', 'rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(217,239,139)', 'rgb(166,217,106)', 'rgb(102,189,99)', 'rgb(26,152,80)', 'rgb(0,104,55)'], 11: ['rgb(165,0,38)', 'rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(217,239,139)', 'rgb(166,217,106)', 'rgb(102,189,99)', 'rgb(26,152,80)', 'rgb(0,104,55)'], 'properties':{'type': 'div', 'blind':[2,2,2,0,0,0,0,0,0],'print':[1,1,1,2,0,0,0,0,0],'copy':[0],'screen':[1,1,1,0,0,0,0,0,0] } } ,
						RdBu:  {3: ['rgb(239,138,98)', 'rgb(247,247,247)', 'rgb(103,169,207)'], 4: ['rgb(202,0,32)', 'rgb(244,165,130)', 'rgb(146,197,222)', 'rgb(5,113,176)'], 5: ['rgb(202,0,32)', 'rgb(244,165,130)', 'rgb(247,247,247)', 'rgb(146,197,222)', 'rgb(5,113,176)'], 6: ['rgb(178,24,43)', 'rgb(239,138,98)', 'rgb(253,219,199)', 'rgb(209,229,240)', 'rgb(103,169,207)', 'rgb(33,102,172)'], 7: ['rgb(178,24,43)', 'rgb(239,138,98)', 'rgb(253,219,199)', 'rgb(247,247,247)', 'rgb(209,229,240)', 'rgb(103,169,207)', 'rgb(33,102,172)'], 8: ['rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)'], 9: ['rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(247,247,247)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)'], 10: ['rgb(103,0,31)', 'rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)', 'rgb(5,48,97)'], 11: ['rgb(103,0,31)', 'rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(247,247,247)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)', 'rgb(5,48,97)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,1,1,0,0,0,0,0],'copy':[0],'screen':[1,1,1,0,0,0,0,0,0] } } ,
						BuRd:  {3: ['rgb(103,169,207)', 'rgb(247,247,247)', 'rgb(239,138,98)'], 4: ['rgb(5,113,176)', 'rgb(146,197,222)', 'rgb(244,165,130)', 'rgb(202,0,32)'], 5: ['rgb(5,113,176)', 'rgb(146,197,222)', 'rgb(247,247,247)', 'rgb(244,165,130)', 'rgb(202,0,32)'], 6: ['rgb(33,102,172)', 'rgb(103,169,207)', 'rgb(209,229,240)', 'rgb(253,219,199)', 'rgb(239,138,98)', 'rgb(178,24,43)'], 7: ['rgb(33,102,172)', 'rgb(103,169,207)', 'rgb(209,229,240)', 'rgb(247,247,247)', 'rgb(253,219,199)', 'rgb(239,138,98)', 'rgb(178,24,43)'], 8: ['rgb(33,102,172)', 'rgb(67,147,195)', 'rgb(146,197,222)', 'rgb(209,229,240)', 'rgb(253,219,199)', 'rgb(244,165,130)', 'rgb(214,96,77)', 'rgb(178,24,43)'], 9: ['rgb(33,102,172)', 'rgb(67,147,195)', 'rgb(146,197,222)', 'rgb(209,229,240)', 'rgb(247,247,247)', 'rgb(253,219,199)', 'rgb(244,165,130)', 'rgb(214,96,77)', 'rgb(178,24,43)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,1,1,0,0,0,0,0],'copy':[0],'screen':[1,1,1,0,0,0,0,0,0] } } ,						
						PiYG:  {3: ['rgb(233,163,201)', 'rgb(247,247,247)', 'rgb(161,215,106)'], 4: ['rgb(208,28,139)', 'rgb(241,182,218)', 'rgb(184,225,134)', 'rgb(77,172,38)'], 5: ['rgb(208,28,139)', 'rgb(241,182,218)', 'rgb(247,247,247)', 'rgb(184,225,134)', 'rgb(77,172,38)'], 6: ['rgb(197,27,125)', 'rgb(233,163,201)', 'rgb(253,224,239)', 'rgb(230,245,208)', 'rgb(161,215,106)', 'rgb(77,146,33)'], 7: ['rgb(197,27,125)', 'rgb(233,163,201)', 'rgb(253,224,239)', 'rgb(247,247,247)', 'rgb(230,245,208)', 'rgb(161,215,106)', 'rgb(77,146,33)'], 8: ['rgb(197,27,125)', 'rgb(222,119,174)', 'rgb(241,182,218)', 'rgb(253,224,239)', 'rgb(230,245,208)', 'rgb(184,225,134)', 'rgb(127,188,65)', 'rgb(77,146,33)'], 9: ['rgb(197,27,125)', 'rgb(222,119,174)', 'rgb(241,182,218)', 'rgb(253,224,239)', 'rgb(247,247,247)', 'rgb(230,245,208)', 'rgb(184,225,134)', 'rgb(127,188,65)', 'rgb(77,146,33)'], 10: ['rgb(142,1,82)', 'rgb(197,27,125)', 'rgb(222,119,174)', 'rgb(241,182,218)', 'rgb(253,224,239)', 'rgb(230,245,208)', 'rgb(184,225,134)', 'rgb(127,188,65)', 'rgb(77,146,33)', 'rgb(39,100,25)'], 11: ['rgb(142,1,82)', 'rgb(197,27,125)', 'rgb(222,119,174)', 'rgb(241,182,218)', 'rgb(253,224,239)', 'rgb(247,247,247)', 'rgb(230,245,208)', 'rgb(184,225,134)', 'rgb(127,188,65)', 'rgb(77,146,33)', 'rgb(39,100,25)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,2,0,0,0,0,0,0],'copy':[0],'screen':[1,1,2,0,0,0,0,0,0] } } ,
						PRGn:  {3: ['rgb(175,141,195)', 'rgb(247,247,247)', 'rgb(127,191,123)'], 4: ['rgb(123,50,148)', 'rgb(194,165,207)', 'rgb(166,219,160)', 'rgb(0,136,55)'], 5: ['rgb(123,50,148)', 'rgb(194,165,207)', 'rgb(247,247,247)', 'rgb(166,219,160)', 'rgb(0,136,55)'], 6: ['rgb(118,42,131)', 'rgb(175,141,195)', 'rgb(231,212,232)', 'rgb(217,240,211)', 'rgb(127,191,123)', 'rgb(27,120,55)'], 7: ['rgb(118,42,131)', 'rgb(175,141,195)', 'rgb(231,212,232)', 'rgb(247,247,247)', 'rgb(217,240,211)', 'rgb(127,191,123)', 'rgb(27,120,55)'], 8: ['rgb(118,42,131)', 'rgb(153,112,171)', 'rgb(194,165,207)', 'rgb(231,212,232)', 'rgb(217,240,211)', 'rgb(166,219,160)', 'rgb(90,174,97)', 'rgb(27,120,55)'], 9: ['rgb(118,42,131)', 'rgb(153,112,171)', 'rgb(194,165,207)', 'rgb(231,212,232)', 'rgb(247,247,247)', 'rgb(217,240,211)', 'rgb(166,219,160)', 'rgb(90,174,97)', 'rgb(27,120,55)'], 10: ['rgb(64,0,75)', 'rgb(118,42,131)', 'rgb(153,112,171)', 'rgb(194,165,207)', 'rgb(231,212,232)', 'rgb(217,240,211)', 'rgb(166,219,160)', 'rgb(90,174,97)', 'rgb(27,120,55)', 'rgb(0,68,27)'], 11: ['rgb(64,0,75)', 'rgb(118,42,131)', 'rgb(153,112,171)', 'rgb(194,165,207)', 'rgb(231,212,232)', 'rgb(247,247,247)', 'rgb(217,240,211)', 'rgb(166,219,160)', 'rgb(90,174,97)', 'rgb(27,120,55)', 'rgb(0,68,27)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,1,1,0,0,0,0,0],'copy':[0],'screen':[1,1,2,2,0,0,0,0,0] } } ,
						RdYlBu:  {3: ['rgb(252,141,89)', 'rgb(255,255,191)', 'rgb(145,191,219)'], 4: ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(171,217,233)', 'rgb(44,123,182)'], 5: ['rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)', 'rgb(171,217,233)', 'rgb(44,123,182)'], 6: ['rgb(215,48,39)', 'rgb(252,141,89)', 'rgb(254,224,144)', 'rgb(224,243,248)', 'rgb(145,191,219)', 'rgb(69,117,180)'], 7: ['rgb(215,48,39)', 'rgb(252,141,89)', 'rgb(254,224,144)', 'rgb(255,255,191)', 'rgb(224,243,248)', 'rgb(145,191,219)', 'rgb(69,117,180)'], 8: ['rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,144)', 'rgb(224,243,248)', 'rgb(171,217,233)', 'rgb(116,173,209)', 'rgb(69,117,180)'], 9: ['rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,144)', 'rgb(255,255,191)', 'rgb(224,243,248)', 'rgb(171,217,233)', 'rgb(116,173,209)', 'rgb(69,117,180)'], 10: ['rgb(165,0,38)', 'rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,144)', 'rgb(224,243,248)', 'rgb(171,217,233)', 'rgb(116,173,209)', 'rgb(69,117,180)', 'rgb(49,54,149)'], 11: ['rgb(165,0,38)', 'rgb(215,48,39)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,144)', 'rgb(255,255,191)', 'rgb(224,243,248)', 'rgb(171,217,233)', 'rgb(116,173,209)', 'rgb(69,117,180)', 'rgb(49,54,149)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,1,1,2,0,0,0,0],'copy':[0],'screen':[1,1,1,2,0,0,0,0,0] } } ,
						BrBG:  {3: ['rgb(216,179,101)', 'rgb(245,245,245)', 'rgb(90,180,172)'], 4: ['rgb(166,97,26)', 'rgb(223,194,125)', 'rgb(128,205,193)', 'rgb(1,133,113)'], 5: ['rgb(166,97,26)', 'rgb(223,194,125)', 'rgb(245,245,245)', 'rgb(128,205,193)', 'rgb(1,133,113)'], 6: ['rgb(140,81,10)', 'rgb(216,179,101)', 'rgb(246,232,195)', 'rgb(199,234,229)', 'rgb(90,180,172)', 'rgb(1,102,94)'], 7: ['rgb(140,81,10)', 'rgb(216,179,101)', 'rgb(246,232,195)', 'rgb(245,245,245)', 'rgb(199,234,229)', 'rgb(90,180,172)', 'rgb(1,102,94)'], 8: ['rgb(140,81,10)', 'rgb(191,129,45)', 'rgb(223,194,125)', 'rgb(246,232,195)', 'rgb(199,234,229)', 'rgb(128,205,193)', 'rgb(53,151,143)', 'rgb(1,102,94)'], 9: ['rgb(140,81,10)', 'rgb(191,129,45)', 'rgb(223,194,125)', 'rgb(246,232,195)', 'rgb(245,245,245)', 'rgb(199,234,229)', 'rgb(128,205,193)', 'rgb(53,151,143)', 'rgb(1,102,94)'], 10: ['rgb(84,48,5)', 'rgb(140,81,10)', 'rgb(191,129,45)', 'rgb(223,194,125)', 'rgb(246,232,195)', 'rgb(199,234,229)', 'rgb(128,205,193)', 'rgb(53,151,143)', 'rgb(1,102,94)', 'rgb(0,60,48)'], 11: ['rgb(84,48,5)', 'rgb(140,81,10)', 'rgb(191,129,45)', 'rgb(223,194,125)', 'rgb(246,232,195)', 'rgb(245,245,245)', 'rgb(199,234,229)', 'rgb(128,205,193)', 'rgb(53,151,143)', 'rgb(1,102,94)', 'rgb(0,60,48)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,1,1,0,0,0,0,0],'copy':[0],'screen':[1,1,1,1,0,0,0,0,0] } } ,
						RdGy:  {3: ['rgb(239,138,98)', 'rgb(255,255,255)', 'rgb(153,153,153)'], 4: ['rgb(202,0,32)', 'rgb(244,165,130)', 'rgb(186,186,186)', 'rgb(64,64,64)'], 5: ['rgb(202,0,32)', 'rgb(244,165,130)', 'rgb(255,255,255)', 'rgb(186,186,186)', 'rgb(64,64,64)'], 6: ['rgb(178,24,43)', 'rgb(239,138,98)', 'rgb(253,219,199)', 'rgb(224,224,224)', 'rgb(153,153,153)', 'rgb(77,77,77)'], 7: ['rgb(178,24,43)', 'rgb(239,138,98)', 'rgb(253,219,199)', 'rgb(255,255,255)', 'rgb(224,224,224)', 'rgb(153,153,153)', 'rgb(77,77,77)'], 8: ['rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(224,224,224)', 'rgb(186,186,186)', 'rgb(135,135,135)', 'rgb(77,77,77)'], 9: ['rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(255,255,255)', 'rgb(224,224,224)', 'rgb(186,186,186)', 'rgb(135,135,135)', 'rgb(77,77,77)'], 10: ['rgb(103,0,31)', 'rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(224,224,224)', 'rgb(186,186,186)', 'rgb(135,135,135)', 'rgb(77,77,77)', 'rgb(26,26,26)'], 11: ['rgb(103,0,31)', 'rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(255,255,255)', 'rgb(224,224,224)', 'rgb(186,186,186)', 'rgb(135,135,135)', 'rgb(77,77,77)', 'rgb(26,26,26)'], 'properties':{'type': 'div','blind':[2],'print':[1,1,1,2,0,0,0,0,0],'copy':[0],'screen':[1,1,2,0,0,0,0,0,0] } } ,
						PuOr:  {3: ['rgb(241,163,64)', 'rgb(247,247,247)', 'rgb(153,142,195)'], 4: ['rgb(230,97,1)', 'rgb(253,184,99)', 'rgb(178,171,210)', 'rgb(94,60,153)'], 5: ['rgb(230,97,1)', 'rgb(253,184,99)', 'rgb(247,247,247)', 'rgb(178,171,210)', 'rgb(94,60,153)'], 6: ['rgb(179,88,6)', 'rgb(241,163,64)', 'rgb(254,224,182)', 'rgb(216,218,235)', 'rgb(153,142,195)', 'rgb(84,39,136)'], 7: ['rgb(179,88,6)', 'rgb(241,163,64)', 'rgb(254,224,182)', 'rgb(247,247,247)', 'rgb(216,218,235)', 'rgb(153,142,195)', 'rgb(84,39,136)'], 8: ['rgb(179,88,6)', 'rgb(224,130,20)', 'rgb(253,184,99)', 'rgb(254,224,182)', 'rgb(216,218,235)', 'rgb(178,171,210)', 'rgb(128,115,172)', 'rgb(84,39,136)'], 9: ['rgb(179,88,6)', 'rgb(224,130,20)', 'rgb(253,184,99)', 'rgb(254,224,182)', 'rgb(247,247,247)', 'rgb(216,218,235)', 'rgb(178,171,210)', 'rgb(128,115,172)', 'rgb(84,39,136)'], 10: ['rgb(127,59,8)', 'rgb(179,88,6)', 'rgb(224,130,20)', 'rgb(253,184,99)', 'rgb(254,224,182)', 'rgb(216,218,235)', 'rgb(178,171,210)', 'rgb(128,115,172)', 'rgb(84,39,136)', 'rgb(45,0,75)'], 11: ['rgb(127,59,8)', 'rgb(179,88,6)', 'rgb(224,130,20)', 'rgb(253,184,99)', 'rgb(254,224,182)', 'rgb(247,247,247)', 'rgb(216,218,235)', 'rgb(178,171,210)', 'rgb(128,115,172)', 'rgb(84,39,136)', 'rgb(45,0,75)'], 'properties':{'type': 'div','blind':[1],'print':[1,1,2,2,0,0,0,0,0],'copy':[1,1,0,0,0,0,0,0,0],'screen':[1,1,1,1,0,0,0,0,0] } } ,
						/** Qualitative **/
						Set2:  {3: ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)'], 4: ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)'], 5: ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)', 'rgb(166,216,84)'], 6: ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)', 'rgb(166,216,84)', 'rgb(255,217,47)'], 7: ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)', 'rgb(166,216,84)', 'rgb(255,217,47)', 'rgb(229,196,148)'], 8: ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)', 'rgb(166,216,84)', 'rgb(255,217,47)', 'rgb(229,196,148)', 'rgb(179,179,179)'], 'properties':{'type': 'qual','blind':[1,2,2,2,0,0,0],'print':[1,1,1,2,2,2],'copy':[0],'screen':[1,1,2,2,2,2] } } ,
						Accent:  {3: ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)'], 4: ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)'], 5: ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)', 'rgb(56,108,176)'], 6: ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(240,2,127)'], 7: ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(240,2,127)', 'rgb(191,91,23)'], 8: ['rgb(127,201,127)', 'rgb(190,174,212)', 'rgb(253,192,134)', 'rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(240,2,127)', 'rgb(191,91,23)', 'rgb(102,102,102)'], 'properties':{'type': 'qual','blind':[2,0,0,0,0,0,0],'print':[1,1,2,2,2,2],'copy':[0],'screen':[1,1,1,2,2,2] } } ,
						Set1:  {3: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)'], 4: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)'], 5: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)'], 6: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)'], 7: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)', 'rgb(166,86,40)'], 8: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)', 'rgb(166,86,40)', 'rgb(247,129,191)'], 9: ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)', 'rgb(166,86,40)', 'rgb(247,129,191)', 'rgb(153,153,153)'], 'properties':{'type': 'qual','blind':[2],'print':[1],'copy':[0],'screen':[1] } } ,
						Set3:  {3: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)'], 4: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)'], 5: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)'], 6: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)'], 7: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)'], 8: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)', 'rgb(252,205,229)'], 9: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)', 'rgb(252,205,229)', 'rgb(217,217,217)'], 10: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)', 'rgb(252,205,229)', 'rgb(217,217,217)', 'rgb(188,128,189)'], 11: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)', 'rgb(252,205,229)', 'rgb(217,217,217)', 'rgb(188,128,189)', 'rgb(204,235,197)'], 12: ['rgb(141,211,199)', 'rgb(255,255,179)', 'rgb(190,186,218)', 'rgb(251,128,114)', 'rgb(128,177,211)', 'rgb(253,180,98)', 'rgb(179,222,105)', 'rgb(252,205,229)', 'rgb(217,217,217)', 'rgb(188,128,189)', 'rgb(204,235,197)', 'rgb(255,237,111)'], 'properties':{'type': 'qual','blind':[2,2,0,0,0,0,0,0,0,0],'print':[1,1,1,1,1,1,2,0,0,0],'copy':[1,2,2,2,2,2,2,0,0,0],'screen':[1,1,1,2,2,2,0,0,0,0] } } ,
						Dark2:  {3: ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)'], 4: ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)'], 5: ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)', 'rgb(102,166,30)'], 6: ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)', 'rgb(102,166,30)', 'rgb(230,171,2)'], 7: ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)', 'rgb(102,166,30)', 'rgb(230,171,2)', 'rgb(166,118,29)'], 8: ['rgb(27,158,119)', 'rgb(217,95,2)', 'rgb(117,112,179)', 'rgb(231,41,138)', 'rgb(102,166,30)', 'rgb(230,171,2)', 'rgb(166,118,29)', 'rgb(102,102,102)'], 'properties':{'type': 'qual','blind':[1,2,2,2,0,0],'print':[1],'copy':[0],'screen':[1] } } ,
						Paired:  {3: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)'], 4: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)'], 5: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)'], 6: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)'], 7: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)'], 8: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)'], 9: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)'], 10: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)'], 11: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)', 'rgb(255,255,153)'], 12: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)', 'rgb(255,255,153)', 'rgb(177,89,40)'], 'properties':{'type': 'qual','blind':[1,1,2,2,2,2,0,0,0],'print':[1,1,1,1,1,2,2,2,2],'copy':[0],'screen':[1,1,1,1,1,1,1,1,2] } } ,
						Pastel2:  {3: ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)'], 4: ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)', 'rgb(244,202,228)'], 5: ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)', 'rgb(244,202,228)', 'rgb(230,245,201)'], 6: ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)', 'rgb(244,202,228)', 'rgb(230,245,201)', 'rgb(255,242,174)'], 7: ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)', 'rgb(244,202,228)', 'rgb(230,245,201)', 'rgb(255,242,174)', 'rgb(241,226,204)'], 8: ['rgb(179,226,205)', 'rgb(253,205,172)', 'rgb(203,213,232)', 'rgb(244,202,228)', 'rgb(230,245,201)', 'rgb(255,242,174)', 'rgb(241,226,204)', 'rgb(204,204,204)'], 'properties':{'type': 'qual','blind':[2,0,0,0,0,0],'print':[2,0,0,0,0,0],'copy':[0],'screen':[2,2,0,0,0,0] } } ,
						Pastel1:  {3: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)'], 4: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)', 'rgb(222,203,228)'], 5: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)', 'rgb(222,203,228)', 'rgb(254,217,166)'], 6: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)', 'rgb(222,203,228)', 'rgb(254,217,166)', 'rgb(255,255,204)'], 7: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)', 'rgb(222,203,228)', 'rgb(254,217,166)', 'rgb(255,255,204)', 'rgb(229,216,189)'], 8: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)', 'rgb(222,203,228)', 'rgb(254,217,166)', 'rgb(255,255,204)', 'rgb(229,216,189)', 'rgb(253,218,236)'], 9: ['rgb(251,180,174)', 'rgb(179,205,227)', 'rgb(204,235,197)', 'rgb(222,203,228)', 'rgb(254,217,166)', 'rgb(255,255,204)', 'rgb(229,216,189)', 'rgb(253,218,236)', 'rgb(242,242,242)'], 'properties':{'type': 'qual','blind':[2,0,0,0,0,0,0],'print':[2,2,2,0,0,0,0],'copy':[0],'screen':[2,2,2,2,0,0,0] } }
					};

					// define array of values
					this.setSeries = function (seriesArr) {
						this.series = Array();
						this.series = seriesArr;
						this.series = this.series.sort(function (a, b) { return a-b });
					};

					// return array of values
					this.getSeries = function () {
						return this.series;
					};

					// set number of classes
					this.setNumClasses = function (n) {
						this.numClasses = n;
					};

					// get number of classes
					this.getNumClasses = function () {
						return this.numClasses;
					};

					// define color ramp color
					this.setColorCode = function (color) {
						this.colorCode = color;
					};

					// get available color ramps
					this.getColorCode = function () {
						return this.colorCode;
					};

					// get color codes
					this.getColorCodes = function () {
						var colorCodes = [];
						for ( code in this.colorSchemes ) {
							if ( this.colorSchemes.hasOwnProperty(code) ) {
								colorCodes.push(code);
							}
						}
						return colorCodes;
					};

					// get color codes by type
					this.getColorCodesByType = function () {
						var colorTypes = {};
						for ( code in this.colorSchemes ) {
							if ( this.colorSchemes.hasOwnProperty(code) ) {
								if( !colorTypes.hasOwnProperty(this.colorSchemes[code].properties.type) ) {
									colorTypes[this.colorSchemes[code].properties.type] = []
								}
								colorTypes[this.colorSchemes[code].properties.type].push(code);
							}
						}
						return colorTypes;
					};

					/**** Classification Methods ****/

					this._classifyEqualInterval = function () {
						var min = Math.min.apply(null, this.series);
						var max = Math.max.apply(null, this.series);

						var a = [];
						var val = min;
						var interval = (max - min) / this.getNumClasses();

						for (i = 0; i <= this.getNumClasses(); i++) {
							a[i] = val;
							val += interval;
						}

						//-> Fix last bound to Max of values
						a[this.getNumClasses()] = max;

						this.range = a;
						this.range.sort(function (a, b) { return a-b });

						return this.range;
					};

					this._classifyQuantile = function () {
						var tmp = this.series.sort(function (a, b) { return a-b });
						var quantiles = [];
						var step = this.series.length / this.getNumClasses();
						for (var i = 1; i < this.getNumClasses(); i++) {
							var qidx = Math.round(i*step+0.49);
							quantiles.push(tmp[qidx-1]); // zero-based
						}
						var bounds = quantiles;

						bounds.unshift(tmp[0]);
						if (bounds[tmp.length - 1] !== tmp[tmp.length - 1])
							bounds.push(tmp[tmp.length - 1]);

						this.range = bounds;
						this.range.sort(function (a, b) { return a-b });

						return this.range;
					};

					this._classifyStdDeviation = function () {
						var min = Math.min.apply(null, this.series);
						var max = Math.max.apply(null, this.series);

						var a = [];

						// number of classes is odd
						if(this.getNumClasses % 2 == 1) {

							// Euclidean division to get the inferior bound
							var infBound = Math.floor(this.getNumClasses() / 2);

							var supBound = infBound + 1;

							// we set the central bounds
							a[infBound] = this._mean(this.series) - ( this._stdDev(this.series) / 2);
							a[supBound] = this._mean(this.series) + ( this._stdDev(this.series) / 2);

							// Values < to infBound, except first one
							for (i = infBound - 1; i > 0; i--) {
								var val = a[i+1] - this._stdDev(this.series);
								a[i] = val;
							}

							// Values > to supBound, except last one
							for (i = supBound + 1; i < this.getNumClasses(); i++) {
								var val = a[i-1] + this._stdDev(this.series);
								a[i] = val;
							}

							// number of classes is even
						} else {

							var meanBound = this.getNumClasses() / 2;

							// we get the mean value
							a[meanBound] = this._mean(this.series);

							// Values < to the mean, except first one
							for (i = meanBound - 1; i > 0; i--) {
								var val = a[i+1] - this._stdDev(this.series);
								a[i] = val;
							}

							// Values > to the mean, except last one
							for (i = meanBound + 1; i < this.getNumClasses(); i++) {
								var val = a[i-1] + this._stdDev(this.series);
								a[i] = val;
							}
						}


						// we finally set the first value
						a[0] = min;

						// we finally set the last value
						a[this.getNumClasses()] = max;

						this.range = a;
						this.range.sort(function (a, b) { return a-b });

						return this.range;
					};

					this._classifyJenks = function () {
						var mat1 = [];
						for ( var x = 0, xl = this.series.length + 1; x < xl; x++) {
							var temp = []
							for ( var j = 0, jl = this.numClasses + 1; j < jl; j++) {
								temp.push(0)
							}
							mat1.push(temp)
						}

						var mat2 = []
						for ( var i = 0, il = this.series.length + 1; i < il; i++) {
							var temp2 = []
							for ( var c = 0, cl = this.numClasses + 1; c < cl; c++) {
								temp2.push(0)
							}
							mat2.push(temp2)
						}

						for ( var y = 1, yl = this.numClasses + 1; y < yl; y++) {
							mat1[0][y] = 1
							mat2[0][y] = 0
							for ( var t = 1, tl = this.series.length + 1; t < tl; t++) {
								mat2[t][y] = Infinity
							}
							var v = 0.0
						}

						for ( var l = 2, ll = this.series.length + 1; l < ll; l++) {
							var s1 = 0.0
							var s2 = 0.0
							var w = 0.0
							for ( var m = 1, ml = l + 1; m < ml; m++) {
								var i3 = l - m + 1
								var val = parseFloat(this.series[i3 - 1])
								s2 += val * val
								s1 += val
								w += 1
								v = s2 - (s1 * s1) / w
								var i4 = i3 - 1
								if (i4 != 0) {
									for ( var p = 2, pl = this.numClasses + 1; p < pl; p++) {
										if (mat2[l][p] >= (v + mat2[i4][p - 1])) {
											mat1[l][p] = i3
											mat2[l][p] = v + mat2[i4][p - 1]
										}
									}
								}
							}
							mat1[l][1] = 1
							mat2[l][1] = v
						}

						var k = this.series.length
						var kclass = []

						for (i = 0, il = this.numClasses + 1; i < il; i++) {
							kclass.push(0)
						}

						kclass[this.numClasses] = parseFloat(this.series[this.series.length - 1])

						kclass[0] = parseFloat(this.series[0])
						var countNum = this.numClasses
						while (countNum >= 2) {
							var id = parseInt((mat1[k][countNum]) - 2)
							kclass[countNum - 1] = this.series[id]
							k = parseInt((mat1[k][countNum] - 1))

							countNum -= 1
						}

						if (kclass[0] == kclass[1]) {
							kclass[0] = 0
						}

						this.range = kclass;
						this.range.sort(function (a, b) { return a-b })

						return this.range; //array of breaks
					};

					/**** End classification methods ****/

					// return array of natural breaks
					this.classify = function (method, classes) {
						this.statMethod = (method !== undefined) ? method : this.statMethod;
						this.numClasses = (classes !== undefined) ? classes : this.numClasses;
						var breaks = undefined;
						switch(method) {
							case 'equal_interval':
								breaks = this._classifyEqualInterval();
								break;
							case 'quantile':
								breaks = this._classifyQuantile();
								break;
							case 'std_deviation':
								breaks = this._classifyStdDeviation();
								break;
							case 'jenks':
								breaks = this._classifyJenks();
								break;
							default:
								breaks = this._classifyJenks();
						}
						this.breaks = breaks;
						return breaks;
					};

					// return types of available classification methods
					this.getClassificationMethods = function () {
						return ['equal_interval', 'quantile'/*, 'std_deviation'*/, 'jenks'];
					};

					this.getBreaks = function () {
						// always re-classify to account for new data
						return this.breaks ? this.breaks : this.classify();
					};

					// get colors from data and num classes
					this.getColors = function () {
						// return array of colors
						return this.colorSchemes[this.colorCode][this.numClasses];
					};

					// get color for a given value
					this.getColorInRange = function (num) {
						// return color code for supplied number
						// [4, 6, 8, 9]
						// [4-5.99, 6-7.99, 8-9]
						var i = 0;
						for(i; i < this.range.length; i++) {
							//number equal to or greater than current value in range
							//we havent reached the last value in range
							if(num >= this.range[i] && i < this.range.length) {
								if(num <= this.range[i + 1]) {
									return this.colorSchemes[this.colorCode][this.numClasses][i];
								}
							} else if(num == this.range[i]) {
								return this.colorSchemes[this.colorCode][this.numClasses][i - 1];
							} else {
								return false;
							}
						}
					};

					/*** Simple Math Functions ***/
					this._mean = function (arr) {
						return parseFloat(this._sum(arr) / arr.length);
					};

					this._sum = function (arr) {
						var sum = 0;
						var i;
						for(i = 0; i < arr.length; i++) {
							sum += arr[i];
						}
						return sum;
					};

					this._variance = function (arr) {
						var tmp = 0;
						for (var i = 0; i < arr.length; i++) {
							tmp += Math.pow( (arr[i] - this._mean(arr)), 2 );
						}

						return (tmp / arr.length);
					};

					this._stdDev = function (arr) {
						return Math.sqrt(this._variance(arr));
					};

					/*** END Simple math Functions ***/
				}


			})();

			// support node module and browser
			if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
				module.exports = classyBrew;
			} else {
				window.classyBrew = classyBrew;
			}

		})();
