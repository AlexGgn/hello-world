			fonction qui crée sur la carte des secteurs dont la couleur dépend de l'indice de Moran du secteur
			// function afficherSecteurs_Geary(L_corr) {
				
				// var moyenne = L_corr[0]; // moyenne statistique des adresses de la ville sélectionnée
				// var liste = L_corr[1]; // données des différents carrés raster de la ville sélectionnée
				
				
				copie la liste d'indices en les répartissant selon leurs valeurs
				// var copie = copieSecteurs_Geary(liste); // ATTENTION nécessité de créer une autre liste, car elle sera automatiquement triée par la fonction brew (une copie "liste_brew = liste" de la 1ère la modifierait également)
				
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices < à 1 de la liste (autocorrélation spatiale positive)
				
				var liste_brew_positive = copie[0];
				
				var brew_positive = new classyBrew();
				brew_positive.setSeries(liste_brew_positive);
				brew_positive.setNumClasses(3); // nombre de couleurs différentes
				brew_positive.setColorCode("RdOr"); // gamme des couleurs : "Red", "Orange", "Wheat"
				brew_positive.classify("jenks"); // méthode de répartition des couleurs : "jenks"
				
				var liste_positive_valeurs = brew_positive.getBreaks(); // liste des bornes des intervalles
				var liste_positive_couleurs = brew_positive.getColors(); // liste des couleurs des intervalles
				
				var liste_positive_decimales = calculerDecimale(liste_positive_valeurs); // dernière décimale importante des bornes des intervalles
				
				
				// crée la répartition des couleurs associées à chaque intervalle de valeur pour les indices >= à 1 de la liste (autocorrélation spatiale négative)
				
				var liste_brew_negative = copie[1];
				
				var brew_negative = new classyBrew();
				brew_negative.setSeries(liste_brew_negative);
				brew_negative.setNumClasses(2); // nombre de couleurs différentes
				brew_negative.setColorCode("Blues"); // gamme des couleurs : "SkyBlue", "DarkBlue"
				brew_negative.classify("jenks"); // méthode de répartition des couleurs : "jenks"
				
				var liste_negative_valeurs = brew_negative.getBreaks(); // liste des bornes des intervalles
				var liste_negative_couleurs = brew_negative.getColors(); // liste des couleurs des intervalles
				
				var liste_negative_decimales = calculerDecimale(liste_negative_valeurs); // dernière décimale importante des bornes des intervalles
				
				
				// définit la dernière décimale importante des valeurs des indices
				var decimales = Math.max(liste_positive_decimales, liste_negative_decimales);


				// for (var secteur = 0; secteur < sec; secteur++) {

					indice de Geary pour le secteur
					// var I = liste[secteur].indice;
					
					// moyenne statistique du secteur
					var valeur = liste[secteur].moyenne;

					couleur du secteur en fonction de la valeur de son indice
					// var couleur = "#FFFFFF"; // "White" si le secteur ne possède aucun indice (manque de données)
					// if (I == 0)
						// couleur = "#8B0000"; // "DarkRed" dans le cas rare mais possible où l'ensemble des valeurs du secteur sont égales
					// if (I > 0) {
						// if (I < 1)
							// couleur = brew_positive.getColorInRange(I);
						// else
							// couleur = brew_negative.getColorInRange(I);
					// }

					créer un polygône à partir de ces adresses
					// var polygon = L.polygon(BDD_secteurs[secteur],{
						// color: 'black',
						// fillColor: couleur,
						// fillOpacity: 1
					// }).addTo(mapStats);
					
					// créer au clic sur le polygône une fenêtre popup contenant le nombre de valeurs du secteur, sa moyenne statistique ainsi que son indice de Geary
					var popup_text = "<span>Moyenne : </span><strong>" + valeur.toFixed(2) + "</strong><br/><span>Indice de Geary : </span><strong>" + I.toFixed(decimales) + "</strong>";
					polygon.bindPopup(popup_text);
				// }


				// var indices_nuls = copie[2]; // boolean qui indique si la liste contient des indices nuls (cas rare mais possible où l'ensemble des valeurs du secteur sont égales)
				// var indices_noData = copie[3]; // boolean qui indique si la liste contient des secteurs qui ne possède aucun indice (manque de données)
				
				afficherLegende_secteurs_Geary(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, liste_negative_valeurs, liste_negative_couleurs, liste_negative_decimales, indices_nuls, indices_noData); // affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte
			// }
			
			
			
			// fonction qui affiche sur la carte la légende des valeurs associées aux différentes couleurs de la carte des indices de Geary des secteurs
			function afficherLegende_secteurs_Geary(liste_positive_valeurs, liste_positive_couleurs, liste_positive_decimales, liste_negative_valeurs, liste_negative_couleurs, liste_negative_decimales, indices_nuls, indices_noData) {
				
				supprime la légende existante, s'il y en a une
				// effacerLegende();
				
				crée la case 'légende'
				// var Legend = document.createElement('div');
				// Legend.setAttribute("id","stats_Statistiques_legende");
				
				
				ajoute le titre à la case 'légende' (indice d'autocorrélation spatiale de la carte : "Moran" ou "Geary" ; global ou local)
				// var myLegend = document.createElement('h2');
				// myLegend.setAttribute("id","stats_Statistiques_legende_titre");
				// myLegend.textContent = "I de Geary";
				// Legend.appendChild(myLegend);
				
				
				// couleurs et valeurs des intervalle de couleurs pour des indices de Geary < à 1 (autocorrélation spatiale positive)
				for (var k = 0; k < liste_positive_valeurs.length-1; k++) {
					
					// valeur limite d'un intervalle
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_positive_valeurs[k].toFixed(liste_positive_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_positive_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
				}
				
				
				// ajout de la valeur intermédiaire (= 1)
				var Value1 = document.createElement('div');
				Value1.setAttribute("class","stats_Statistiques_legende_ligne");
				var myValue1 = document.createElement('span');
				myValue1.setAttribute("class","stats_Statistiques_legende_valeur");
				myValue1.textContent = "1";
				Value1.appendChild(myValue1);
				Legend.appendChild(Value1);
				
				
				// couleurs et valeurs des intervalle de couleurs pour des indices de Geary >= à 1 (autocorrélation spatiale négative)
				for (var k = 0; k < liste_negative_valeurs.length-1; k++) {
					
					// carré de la couleur de l'intervalle
					var Color = document.createElement('div');
					Color.setAttribute("class","stats_Statistiques_legende_ligne");
					var myColor = document.createElement('div');
					myColor.setAttribute("class","stats_Statistiques_legende_couleur");
					var couleur = liste_negative_couleurs[k];
					myColor.setAttribute("style","background-color:"+couleur+";");
					Color.appendChild(myColor);
					Legend.appendChild(Color);
					
					// valeur limite supérieure d'un intervalle (sauf la première)
					var Value = document.createElement('div');
					Value.setAttribute("class","stats_Statistiques_legende_ligne");
					var myValue = document.createElement('span');
					myValue.setAttribute("class","stats_Statistiques_legende_valeur");
					myValue.textContent = liste_negative_valeurs[k+1].toFixed(liste_negative_decimales);
					Value.appendChild(myValue);
					Legend.appendChild(Value);
				}
				
				
				ajout de la case des valeurs nulles (si la liste affichée en contient)
				// if (indices_nuls == true) {
				
					// var Nuls = document.createElement('div');
					// Nuls.setAttribute("id","stats_Statistiques_legende_nuls");
					
					// var Nuls_color = document.createElement('div');
					// Nuls_color.setAttribute("class","stats_Statistiques_legende_couleur");
					// Nuls_color.setAttribute("id","stats_Statistiques_legende_nuls_couleur");
					// Nuls_color.setAttribute("style","background-color: #8B0000; margin-left: 5;");
					// Nuls.appendChild(Nuls_color);
					
					// var Nuls_value = document.createElement('div');
					// Nuls_value.setAttribute("id","stats_Statistiques_legende_nuls_valeur");
					// var myNuls_value = document.createElement('span');
					// myNuls_value.textContent = "constante";
					// Nuls_value.appendChild(myNuls_value);
					// Nuls.appendChild(Nuls_value);
					
					// Legend.appendChild(Nuls);
				// }
				
				
				ajout de la case des secteurs sans valeur (si la liste affichée en contient)
				// if (indices_noData == true) {
				
					// var NoData = document.createElement('div');
					// NoData.setAttribute("id","stats_Statistiques_legende_noData");
					
					// var NoData_color = document.createElement('div');
					// NoData_color.setAttribute("class","stats_Statistiques_legende_couleur");
					// NoData_color.setAttribute("id","stats_Statistiques_legende_noData_couleur");
					// NoData_color.setAttribute("style","background-color: #FFFFFF; margin-left: 5;");
					// NoData.appendChild(NoData_color);
					
					// var NoData_value = document.createElement('div');
					// NoData_value.setAttribute("id","stats_Statistiques_legende_noData_valeur");
					// var myNoData_value = document.createElement('span');
					// myNoData_value.textContent = "no Data";
					// NoData_value.appendChild(myNoData_value);
					// NoData.appendChild(NoData_value);
					
					// Legend.appendChild(NoData);
				// }
				
				
				ajout du bouton d'informations
				// var Button = document.createElement('a');
				// Button.setAttribute("class","stats_a");
				// Button.setAttribute("href","#");
				// Button.setAttribute("onclick","afficherInformations_secteurs_Geary("+indices_nuls+","+indices_noData+"); return false;");
				// var myButton = document.createElement('img');
				// myButton.setAttribute("id","stats_Statistiques_legende_infos_button");
				// myButton.setAttribute("src","../images/informations.jpg");
				// myButton.setAttribute("alt","afficher des explications sur l'indice de Moran local");
				// Button.appendChild(myButton);
				// Legend.appendChild(Button);
				
				// document.body.appendChild(Legend);
			// }
			
			
			
			fonction qui affiche/efface la fenêtre d'informations sur l'indice de Geary des secteurs, au clic sur le bouton d'informations
			// function afficherInformations_secteurs_Geary(indices_nuls, indices_noData) {
				
				affiche la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				// if (infos_test == 0) {
					
					// var Infos = document.createElement('div');
					// Infos.setAttribute("id","stats_Statistiques_legende_infos");
					
					// var InfosTitre = document.createElement('p');
					// var myInfosTitre = document.createElement('strong');
					// myInfosTitre.textContent = "Indice de Geary :";
					// InfosTitre.appendChild(myInfosTitre);
					// Infos.appendChild(InfosTitre);
					
					// var myInfos1 = document.createElement('p');
					// myInfos1.textContent = "I < 1 indique une concentration de valeurs similaires dans le secteur, la concentration étant d'autant plus significative que I est faible.";
					// Infos.appendChild(myInfos1);
					
					// var myInfos2 = document.createElement('p');
					// myInfos2.textContent = "I > 1 indique une dispersion de valeurs différentes dans le secteur, la dispersion étant d'autant plus régulière que I est élevé.";
					// Infos.appendChild(myInfos2);
					
					// if (indices_nuls == true) {
						// var myInfos3 = document.createElement('p');
						// myInfos3.textContent = "Un secteur de couleur marron ne contient que des valeurs strictement égales (I = 0).";
						// Infos.appendChild(myInfos3);
					// }
					
					// if (indices_noData == true) {
						// var myInfos4 = document.createElement('p');
						// myInfo4.textContent = "Un secteur de couleur blanche ne contient pas suffisamment de valeurs pour que son indice de Moran soit calculé.";
						// Infos.appendChild(myInfos4);
					// }
					
					// document.body.appendChild(Infos);
					
					// infos_test = 1;
				// }
				
				
				efface la fenêtre d'informations sur l'indice d'autocorrélation spatiale
				// else {
					// effacerInformations();
				// }
			// }
			
			
			
			// fonction qui crée une liste de clusters auxquels appartiennt les secteurs (pour l'indice de Moran) à partir d'une liste de valeurs statistiques
			function autocorrelationSecteurs_Moran_clusters(L) {
			
				var L_corr = []; // crée une nouvelle liste des secteurs vide d'autocorrélation spatiale
				
				
				var moyenne_global = calculerMoyenne_secteurs(L); // moyenne de la statistique pour l'ensemble des adresses des différents sous-secteurs statistiques
				
				
				for (var secteur of L) {
				
					var n = secteur.length; // nombre total de valeurs statistiques dans le secteur
					
					
					// le nombre de valeurs dans le secteur doit être suffisament élevé
					if (n < nombre_voisins_secteurs_minimum) {
						var indice_noData = new Indice_cluster(0, 0,"noData");
						L_corr.push(indice_noData);
					}
						
						
					else {
						
						var Imoran = 0; // indice de Moran pour le secteur
					
						var moyenne = calculerMoyenne_secteur(secteur); // moyenne de la statistique pour les adresses du secteur
						
						var variance = 0; // variance (moment centré d'ordre 2) de la statistique (dans le secteur)
						var moment = 0; // moment centré d'ordre 4 de la statistique (dans le secteur)
						
						var W = 0; // somme des termes de la matrice de pondération (dans le secteur)
						var W2 = 0; // somme des termes de la matrice de pondération au carré (dans le secteur)
						var W_2 = 0; // somme des lignes de la matrice de pondération au carré (dans le secteur)
						
						
						for (var i = 0; i < n; i++) {
							
							var Imoran_i = 0; // indice de Moran local
							
							var W_i = 0; // somme des termes de la i-ème ligne de la matrice de pondération du secteur
							
							
							for (var j = 0; j < n; j++) {
								
								if (i != j) {
									
									// le poids entre 2 voisins d'un même secteur correspond à l'inverse de la distance qui les sépare à laquelle on ajoute 0.001 Nq (~2m) afin de pallier au fait qu'une adresse peut posséder plusieurs personnes (ATTENTION division / 0)
									var distance = ( (secteur[j].latitude - secteur[i].latitude)**2 + ((secteur[j].longitude - secteur[i].longitude) * coeff_longitude)**2 )**0.5 + 0.001;
									var ponderation = 1 / distance;
									
									W_i += ponderation;
									W2 += ponderation ** 2;
									
									Imoran_i += ponderation * (secteur[j].valeur - moyenne);
								}
							}
							
							W += W_i;
							W_2 += W_i ** 2;
							
							Imoran_i *= (secteur[i].valeur - moyenne);
						
							
							Imoran += Imoran_i;
							variance += (secteur[i].valeur - moyenne) ** 2;
							moment += (secteur[i].valeur - moyenne) ** 4;
						}
						
						variance = variance / n; 
						moment = moment / n;
						
						
						// cluster auquel appartient le carré ("High/High", "Low/Low", "High/Low", "Low/High" ou "non significatif")
						var cluster = "non significatif";
						
						
						var HighLow = 0; // indique si la valeur moyenne du secteur est supérieure (= 1) ou inférieure (= 0) à la moyenne
						if (moyenne > moyenne_global)
							HighLow = 1;
						
						
						// ATTENTION au cas (rare mais possible !) où l'ensemble des valeurs dans le secteur sont égales
						if (variance == 0) {
							
							Imoran = 0;
							
							// cluster auquel appartient le carré
							if (HighLow == 1)
								cluster = "H/H";
							if (HighLow == 0)
								cluster = "L/L";
						}
						
						
						else {
							// normalisation de l'indice de Moran
							Imoran = Imoran / variance / W;
							
							
							// calcul du z-score de la valeur attendue sous l'hypothèse d'indépendance spatiale (Imoran suit une loi normale)
								
								// calcul de l'espérance
								var esperance0 = - 1 / (n-1);
								
								// calcul des éléments de la variance
								var s1 = (n**2 - 3*n + 3) * 2 * W2  -  n * W_2  +  3 * W**2
								var s2 = moment / variance**2;
								var s3 = (1 - 2*n) * 2 * W2  +  6 * W**2
								
								// calcul de la variance
								var variance0 = ( n * s1 - s2 * s3 )  /  ( (n-1) * (n-2) * (n-3) * W**2 );
								
								// calcul du z-score (z-score suit une loi normale centrée réduite)
								var z_score = (Imoran - esperance0) / variance0**0.5;
							
							
							// l'indice est significatif ssi |z_score| > z_score_minimal
							if (Math.abs(z_score) >= z_score_minimal) {
								
								if (Imoran > 0) {
									if (HighLow == 1)
										cluster = "H/H";
									if (HighLow == 0)
										cluster = "L/L";
								}
								
								else {
									if (HighLow == 1)
										cluster = "H/L";
									if (HighLow == 0)
										cluster = "L/H";
								}
							}
						}
						
						
						// ajoute la donnée du secteur
						var indice = new Indice_cluster(moyenne, Imoran, cluster);
						L_corr.push(indice);
					}
				}
				
				
				return [moyenne_global, L_corr];
			}
			
			
			
			
			for (var secteur = 0; secteur < sec; secteur++) {

					// indice de Moran/Geary local pour le secteur
					var I = liste[secteur].indice;
					
					// moyenne statistique du secteur
					var valeur = liste[secteur].moyenne;


					// couleur du secteur en fonction de sa valeur
					
					var couleur = "#FFFFFF"; // "White" si le secteur ne possède aucun indice (manque de données)
					
					if (liste[secteur].significativite == 2)
						couleur = "#8B0000"; // "DarkRed" dans le cas rare mais possible où l'ensemble des valeurs du secteur sont égales
					if (liste[secteur].significativite == 0)
						couleur = "#808080"; // "Grey" si l'indice n'est pas significatif
					
					// coloré selon la valeur de l'indice s'il est significatif
					if (liste[secteur].significativite == 1) {
						if (I >= 0)
							couleur = brew_positive.getColorInRange(I);
						else {
							if (indices_negatifs == true)
								couleur = brew_negative.getColorInRange(I);
						}
					}


					// créer un polygône à partir de ces adresses
					var polygon = L.polygon(BDD_secteurs[secteur],{
						color: 'black',
						fillColor: couleur,
						fillOpacity: 1
					}).addTo(mapStats);
					
					// créer au clic sur le polygône une fenêtre popup contenant le nombre de valeurs du secteur, sa moyenne statistique ainsi que son indice de Geary
					var popup_text = "<span>Moyenne : </span><strong>" + valeur.toFixed(2) + "</strong><br/><span>Indice de Moran : </span><strong>" + I.toFixed(decimales) + "</strong>";
					polygon.bindPopup(popup_text);
				}
