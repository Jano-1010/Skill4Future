/* Skill4Future: Rechner in den Beispielen. Pro Thema (body[data-id]) gibt es einen oder mehrere Rechner. */
(function () {
  "use strict";

  // ---------- Hilfsfunktionen ----------
  function grp(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, "'"); }
  function num(n, d) {
    d = d || 0;
    var neg = n < 0 && Math.round(Math.abs(n) * Math.pow(10, d)) > 0;
    var s = Math.abs(n).toFixed(d).split(".");
    return (neg ? "−" : "") + grp(s[0]) + (s[1] ? "," + s[1] : "");
  }
  function chf(n) { return "CHF " + num(n, 0); }
  function pc(n, d) { return num(n, d === undefined ? 1 : d) + " %"; }
  function mon(n) { return num(n, 0) + " Monate"; }
  function pow(a, b) { return Math.pow(a, b); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  // Endwert einer Rente mit Einzahlung am Jahresende
  function fvAnnuity(p, r, n) { return r === 0 ? p * n : p * (pow(1 + r, n) - 1) / r; }

  function parse(str) {
    var s = String(str).replace(/['’\s]/g, "").replace(",", ".").replace("−", "-");
    var x = parseFloat(s);
    return isNaN(x) ? 0 : x;
  }

  // Feld: k = Schlüssel, l = Beschriftung, v = Startwert, u = Einheit, d = Nachkommastellen, min/max = Grenzen
  function f(k, l, v, u, o) {
    o = o || {};
    return { k: k, l: l, v: v, u: u, d: o.d || 0, min: o.min === undefined ? 0 : o.min, max: o.max, h: o.h };
  }

  // ---------- Rechner pro Thema ----------
  var C = {};

  C.sparkonto = [
    {
      t: "Notgroschen berechnen",
      in: [
        f("fix", "Monatliche Fixkosten", 3500, "CHF", { h: "Miete, Krankenkasse, Essen, Handy, Verkehr" }),
        f("have", "Bereits gespart", 0, "CHF"),
        f("rate", "Das kann ich pro Monat sparen", 300, "CHF"),
        f("m", "Eigene Reserve in Monaten", 4, "Monate", { d: 1, min: 1, max: 24 })
      ],
      calc: function (v) {
        function row(m) {
          var ziel = v.fix * m, fehlt = Math.max(0, ziel - v.have);
          return [m + " Monate", chf(ziel), v.rate > 0 ? (fehlt === 0 ? "erreicht" : mon(Math.ceil(fehlt / v.rate))) : "–"];
        }
        var ziel = v.fix * v.m, fehlt = Math.max(0, ziel - v.have);
        return {
          main: ["Notgroschen für " + num(v.m, v.m % 1 ? 1 : 0) + " Monate", chf(ziel),
            v.rate > 0 ? (fehlt === 0 ? "Ziel bereits erreicht." : "Noch " + chf(fehlt) + " fehlen, bei " + chf(v.rate) + " pro Monat dauert das " + mon(Math.ceil(fehlt / v.rate)) + " (rund " + num(Math.ceil(fehlt / v.rate) / 12, 1) + " Jahre).") : "Trage eine Sparrate ein, um die Dauer zu sehen."],
          table: { head: ["Reserve", "Betrag", "Sparen bis zum Ziel"], rows: [row(3), row(6), row(v.m)] }
        };
      }
    },
    {
      t: "Kaufkraft: Was bleibt von deinem Geld?",
      in: [
        f("b", "Betrag", 10000, "CHF"),
        f("z", "Zins auf dem Konto", 0, "% pro Jahr", { d: 2 }),
        f("t", "Teuerung", 2, "% pro Jahr", { d: 2 }),
        f("n", "Dauer", 10, "Jahre", { max: 60 })
      ],
      calc: function (v) {
        var nominal = v.b * pow(1 + v.z / 100, v.n);
        var real = nominal / pow(1 + v.t / 100, v.n);
        return {
          main: ["Kaufkraft nach " + v.n + " Jahren", chf(real), "Entspricht heutigen Franken. Der Verlust beträgt " + chf(v.b - real) + "."],
          rows: [["Kontostand nominal", chf(nominal)], ["Kaufkraft real", chf(real)]]
        };
      }
    }
  ];

  C.zinseszins = [{
    t: "Sparplan berechnen",
    in: [
      f("s", "Startkapital", 0, "CHF"),
      f("m", "Sparrate pro Monat", 300, "CHF"),
      f("r", "Rendite pro Jahr", 4, "%", { d: 2, max: 30 }),
      f("n", "Dauer", 30, "Jahre", { max: 70 })
    ],
    calc: function (v) {
      var r = v.r / 100, jahr = v.m * 12;
      function end(n) { return v.s * pow(1 + r, n) + fvAnnuity(jahr, r, n); }
      function row(n) {
        var e = end(n), ein = v.s + jahr * n;
        return [n + " Jahre", chf(ein), chf(e), chf(e - ein)];
      }
      var e = end(v.n), ein = v.s + jahr * v.n;
      return {
        main: ["Endwert nach " + v.n + " Jahren", chf(e), "Davon einbezahlt " + chf(ein) + ", Ertrag " + chf(e - ein) + (e > 0 ? " (" + pc((e - ein) / e * 100, 0) + " des Endwerts)." : ".")],
        table: { head: ["Dauer", "Einbezahlt", "Endwert", "Ertrag"], rows: [row(20), row(30), row(40), row(v.n)] },
        note: "Einzahlung vereinfacht am Jahresende, konstante Rendite. Modellrechnung, keine Prognose."
      };
    }
  }];

  C.etf = [{
    t: "Kosten über die Jahre vergleichen",
    in: [
      f("b", "Anlagebetrag (einmalig)", 50000, "CHF"),
      f("r", "Rendite vor Kosten", 5, "% pro Jahr", { d: 2, max: 30 }),
      f("a", "Kosten Variante A (z. B. ETF)", 0.2, "% pro Jahr", { d: 2, max: 10 }),
      f("c", "Kosten Variante B (z. B. teurer Fonds)", 1.5, "% pro Jahr", { d: 2, max: 10 }),
      f("n", "Dauer", 30, "Jahre", { max: 70 })
    ],
    calc: function (v) {
      var ea = v.b * pow(1 + (v.r - v.a) / 100, v.n), eb = v.b * pow(1 + (v.r - v.c) / 100, v.n);
      return {
        main: ["Unterschied nach " + v.n + " Jahren", chf(ea - eb), "Variante A ist um diesen Betrag besser, wenn die Rendite vor Kosten gleich ist."],
        rows: [["Netto-Rendite A", pc(v.r - v.a, 2)], ["Endwert A", chf(ea)], ["Netto-Rendite B", pc(v.r - v.c, 2)], ["Endwert B", chf(eb)]],
        note: "Modellrechnung mit konstanter Rendite, keine Prognose."
      };
    }
  }];

  C.aktien = [{
    t: "Verlust und nötiger Gewinn",
    in: [
      f("b", "Anfangswert", 10000, "CHF"),
      f("l", "Verlust", 50, "%", { d: 1, max: 99.9 })
    ],
    calc: function (v) {
      var l = v.l / 100, rest = v.b * (1 - l), g = l / (1 - l);
      return {
        main: ["Nötiger Gewinn zum Aufholen", pc(g * 100, 1), "Von " + chf(rest) + " zurück auf " + chf(v.b) + " sind " + chf(v.b - rest) + " Gewinn nötig."],
        rows: [["Wert nach dem Verlust", chf(rest)], ["Verlust in CHF", chf(v.b - rest)]]
      };
    }
  }];

  C.anlageklassen = [{
    t: "Aufteilung auf Anlageklassen",
    in: [
      f("b", "Betrag", 100000, "CHF"),
      f("li", "Liquidität", 10, "%", { d: 1, max: 100 }),
      f("ob", "Obligationen", 30, "%", { d: 1, max: 100 }),
      f("ak", "Aktien", 60, "%", { d: 1, max: 100 }),
      f("sa", "Annahme: Aktien in einem schlechten Jahr", -30, "%", { d: 1, min: -100, max: 100 }),
      f("so", "Annahme: Obligationen in einem schlechten Jahr", 2, "%", { d: 1, min: -100, max: 100 })
    ],
    calc: function (v) {
      var sum = v.li + v.ob + v.ak;
      var verl = (v.li * 0 + v.ob * v.so + v.ak * v.sa) / 100 / 100 * v.b;
      var warn = Math.abs(sum - 100) > 0.05 ? "Die Anteile ergeben " + pc(sum, 1) + ", nicht 100 %. Passe sie an." : "";
      return {
        main: ["Ergebnis im schlechten Jahr", chf(verl), pc(sum ? (v.ob * v.so + v.ak * v.sa) / 100 : 0, 1) + " auf das Portfolio." + (warn ? " " + warn : "")],
        table: { head: ["Klasse", "Anteil", "Betrag"], rows: [["Liquidität", pc(v.li), chf(v.b * v.li / 100)], ["Obligationen", pc(v.ob), chf(v.b * v.ob / 100)], ["Aktien", pc(v.ak), chf(v.b * v.ak / 100)]] },
        note: "Gedankenexperiment, keine Prognose. Liquidität zählt mit 0 % Veränderung."
      };
    }
  }];

  function allokation(withChf) {
    return [{
      t: "Aufteilung und schlechtes Jahr",
      in: [
        f("b", "Vermögen", 100000, "CHF"),
        f("ak", "Anteil Aktien", 80, "%", { d: 1, max: 100 }),
        f("sa", "Aktien im schlechten Jahr", -30, "%", { d: 1, min: -100, max: 1000 }),
        f("so", "Obligationen im schlechten Jahr", 2, "%", { d: 1, min: -100, max: 1000 })
      ],
      calc: function (v) {
        var a = v.ak / 100, p = a * v.sa + (1 - a) * v.so;
        return {
          main: ["Ergebnis des Portfolios", pc(p, 1), (p >= 0 ? "Gewinn " : "Verlust ") + chf(Math.abs(p / 100 * v.b)) + " auf " + chf(v.b) + "."],
          rows: [["Rechnung", num(a, 2) + " × (" + num(v.sa, 1) + " %) + " + num(1 - a, 2) + " × (" + num(v.so, 1) + " %)"], ["Anteil Obligationen", pc(100 - v.ak, 1)]],
          note: "Gedankenexperiment, keine Prognose."
        };
      }
    }];
  }
  C["asset-allocation"] = allokation();

  C.strategien = [{
    t: "Strategien im schlechten Jahr",
    in: [
      f("b", "Vermögen", 100000, "CHF"),
      f("sa", "Aktien im schlechten Jahr", -30, "%", { d: 1, min: -100, max: 1000 }),
      f("so", "Obligationen im schlechten Jahr", 2, "%", { d: 1, min: -100, max: 1000 }),
      f("ak", "Eigener Aktienanteil", 60, "%", { d: 1, max: 100 })
    ],
    calc: function (v) {
      function row(a) {
        var p = a * v.sa + (1 - a) * v.so;
        return [pc(a * 100, 0), pc(p, 1), chf(p / 100 * v.b)];
      }
      var own = row(v.ak / 100);
      return {
        main: ["Dein Aktienanteil von " + pc(v.ak, 0), own[1], "Entspricht " + own[2] + " bei " + chf(v.b) + "."],
        table: { head: ["Aktienanteil", "Ergebnis", "in CHF"], rows: [row(0.25), row(0.5), row(0.75), row(1), row(v.ak / 100)] },
        note: "Letzte Zeile: dein eigener Anteil. Gedankenspiel, keine Prognose."
      };
    }
  }];

  C.diversifikation = [{
    t: "Totalausfall eines Titels",
    in: [
      f("b", "Vermögen", 100000, "CHF"),
      f("n", "Anzahl gleich gewichteter Titel", 20, "", { min: 1, max: 100000 }),
      f("l", "Verlust des ausfallenden Titels", 100, "%", { d: 0, max: 100 })
    ],
    calc: function (v) {
      var n = Math.max(1, Math.round(v.n)), anteil = 1 / n, verl = anteil * v.l / 100;
      return {
        main: ["Verlust im Gesamtvermögen", pc(verl * 100, 2), "Das sind " + chf(verl * v.b) + " von " + chf(v.b) + "."],
        rows: [["Anteil pro Titel", pc(anteil * 100, 2)], ["Betrag pro Titel", chf(v.b * anteil)]]
      };
    }
  }];

  C.rebalancing = [{
    t: "Rebalancing berechnen",
    in: [
      f("b", "Vermögen zu Beginn", 100000, "CHF"),
      f("z", "Ziel-Anteil Aktien", 60, "%", { d: 1, max: 100 }),
      f("ra", "Rendite Aktien im Jahr", 20, "%", { d: 1, min: -100, max: 1000 }),
      f("ro", "Rendite Obligationen im Jahr", 0, "%", { d: 1, min: -100, max: 1000 })
    ],
    calc: function (v) {
      var a0 = v.b * v.z / 100, o0 = v.b - a0;
      var a1 = a0 * (1 + v.ra / 100), o1 = o0 * (1 + v.ro / 100), t = a1 + o1;
      var anteil = t ? a1 / t * 100 : 0, ziel = t * v.z / 100, diff = a1 - ziel;
      return {
        main: [diff >= 0 ? "Aktien verkaufen" : "Aktien kaufen", chf(Math.abs(diff)), "Gleicher Betrag in Obligationen " + (diff >= 0 ? "kaufen" : "verkaufen") + ", um wieder " + pc(v.z, 1) + " Aktien zu halten."],
        table: { head: ["", "Aktien", "Obligationen", "Total", "Anteil Aktien"], rows: [["Start", chf(a0), chf(o0), chf(v.b), pc(v.z, 1)], ["Nach einem Jahr", chf(a1), chf(o1), chf(t), pc(anteil, 1)], ["Ziel", chf(ziel), chf(t - ziel), chf(t), pc(v.z, 1)]] }
      };
    }
  }];

  C.krypto = [{
    t: "Wie viel Krypto verträgt dein Vermögen?",
    in: [
      f("b", "Gesamtvermögen", 100000, "CHF"),
      f("a", "Anteil Krypto", 5, "%", { d: 1, max: 100 }),
      f("l", "Kursverlust bei Krypto", 60, "%", { d: 1, max: 100 })
    ],
    calc: function (v) {
      var k = v.b * v.a / 100, verl = k * v.l / 100;
      return {
        main: ["Verlust im Gesamtvermögen", pc(v.b ? verl / v.b * 100 : 0, 1), chf(verl) + " von " + chf(v.b) + ". Es bleiben " + chf(v.b - verl) + "."],
        rows: [["Betrag in Krypto", chf(k)], ["Verlust bei Krypto", chf(verl)]],
        note: "Rechenbeispiel, keine Prognose."
      };
    }
  }];

  C.risikoprofil = [{
    t: "Verlustgrenze und Aktienanteil",
    in: [
      f("b", "Anlagebetrag", 50000, "CHF"),
      f("t", "Maximaler Verlust, den ich aushalte", 10, "%", { d: 1, max: 100 }),
      f("sa", "Annahme: Aktien im schlechten Jahr", -30, "%", { d: 1, min: -100, max: -0.1 }),
      f("so", "Annahme: Obligationen im schlechten Jahr", 2, "%", { d: 1, min: -100, max: 100 })
    ],
    calc: function (v) {
      var a = clamp((v.so + v.t) / (v.so - v.sa), 0, 1);
      var p = a * v.sa + (1 - a) * v.so;
      return {
        main: ["Höchster Aktienanteil im Modell", pc(a * 100, 0), "Im schlechten Jahr ergäbe das " + pc(p, 1) + " oder " + chf(p / 100 * v.b) + "."],
        rows: [["Aktien", chf(v.b * a)], ["Obligationen", chf(v.b * (1 - a))]],
        note: "Reines Rechenmodell mit nur einer Kennzahl. Dein Risikoprofil hängt auch von Anlagehorizont und Reserven ab. Keine Anlageempfehlung."
      };
    }
  }];

  C.gesamtvermoegen = [{
    t: "Dein Gesamtvermögen",
    in: [
      f("pk", "Pensionskasse (gebunden)", 250000, "CHF"),
      f("a3", "Säule 3a (gebunden)", 60000, "CHF"),
      f("ei", "Eigenkapital im Eigenheim", 200000, "CHF"),
      f("ws", "Wertschriften (frei)", 40000, "CHF"),
      f("sp", "Sparkonto (frei)", 50000, "CHF")
    ],
    calc: function (v) {
      var t = v.pk + v.a3 + v.ei + v.ws + v.sp, geb = v.pk + v.a3 + v.ei, frei = v.ws + v.sp;
      function r(n, x) { return [n, chf(x), pc(t ? x / t * 100 : 0, 1)]; }
      return {
        main: ["Frei verfügbar", pc(t ? frei / t * 100 : 0, 1), chf(frei) + " von " + chf(t) + ". Gebunden oder in der Immobilie: " + chf(geb) + " (" + pc(t ? geb / t * 100 : 0, 1) + ")."],
        table: { head: ["Posten", "Betrag", "Anteil"], rows: [r("Pensionskasse", v.pk), r("Säule 3a", v.a3), r("Eigenheim", v.ei), r("Wertschriften", v.ws), r("Sparkonto", v.sp), ["Total", chf(t), "100 %"]] }
      };
    }
  }];

  C.haftpflicht = [{
    t: "Was ein Schaden kosten kann",
    in: [
      f("hk", "Heilungskosten (nicht gedeckt)", 20000, "CHF"),
      f("lo", "Monatslohn der verletzten Person", 5500, "CHF"),
      f("mo", "Arbeitsunfähig für", 6, "Monate", { max: 600 }),
      f("ge", "Genugtuung", 15000, "CHF"),
      f("sa", "Sachschäden", 1000, "CHF"),
      f("pr", "Prämie Haftpflicht pro Jahr", 150, "CHF")
    ],
    calc: function (v) {
      var ausfall = v.lo * v.mo, t = v.hk + ausfall + v.ge + v.sa;
      return {
        main: ["Mögliche Forderung", chf(t), v.pr > 0 ? "Das entspricht " + num(t / v.pr, 0) + " Jahresprämien." : "Trage eine Prämie ein, um das Verhältnis zu sehen."],
        rows: [["Heilungskosten", chf(v.hk)], ["Erwerbsausfall", chf(ausfall)], ["Genugtuung", chf(v.ge)], ["Sachschäden", chf(v.sa)]],
        note: "Beispielzahlen, tatsächliche Forderungen können deutlich höher sein."
      };
    }
  }];

  C.hausrat = [{
    t: "Unterversicherung prüfen",
    in: [
      f("nw", "Neuwert deines Hausrats", 60000, "CHF"),
      f("vs", "Versicherungssumme", 40000, "CHF"),
      f("sc", "Schaden", 20000, "CHF")
    ],
    calc: function (v) {
      var q = v.nw ? Math.min(1, v.vs / v.nw) : 1, z = v.sc * q;
      return {
        main: ["Die Versicherung zahlt", chf(z), v.sc - z > 0.5 ? "Du bleibst auf " + chf(v.sc - z) + " sitzen." : "Voll gedeckt, keine Kürzung."],
        rows: [["Deckungsgrad", pc(q * 100, 1)], ["Rechnung", chf(v.sc) + " × " + chf(Math.min(v.vs, v.nw)).replace("CHF ", "") + " / " + chf(v.nw).replace("CHF ", "")]],
        note: "Gilt ohne Unterversicherungsverzicht. Prüfe die Bedingungen deiner Police."
      };
    }
  }];

  C.immobilien = [{
    t: "Tragbarkeit berechnen",
    in: [
      f("kp", "Kaufpreis", 750000, "CHF"),
      f("ek", "Eigenkapital", 20, "% vom Kaufpreis", { d: 1, max: 100 }),
      f("kz", "Kalkulatorischer Zins", 5, "%", { d: 2, max: 20 }),
      f("nk", "Nebenkosten", 1, "% vom Kaufpreis", { d: 2, max: 10 }),
      f("am", "Amortisation der 2. Hypothek in", 15, "Jahre", { min: 1, max: 40 }),
      f("ez", "Tatsächlicher Zins (zum Vergleich)", 2, "%", { d: 2, max: 20 })
    ],
    calc: function (v) {
      var ekb = v.kp * v.ek / 100, hyp = v.kp - ekb;
      var h1 = Math.min(hyp, v.kp * 2 / 3), h2 = hyp - h1;
      var zins = hyp * v.kz / 100, nk = v.kp * v.nk / 100, am = h2 / v.am;
      var tot = zins + nk + am, einkommen = tot * 3;
      var real = hyp * v.ez / 100 + nk + am;
      return {
        main: ["Nötiges Bruttoeinkommen", chf(einkommen) + " pro Jahr", "Die Tragbarkeit verlangt, dass die Kosten höchstens ein Drittel des Bruttoeinkommens ausmachen."],
        rows: [
          ["Eigenkapital", chf(ekb) + (v.ek < 20 ? " (unter 20 %)" : "")],
          ["Hypothek", chf(hyp)],
          ["1. Hypothek (bis 2/3)", chf(h1)],
          ["2. Hypothek", chf(h2)],
          ["Zins kalkulatorisch", chf(zins)],
          ["Nebenkosten", chf(nk)],
          ["Amortisation", chf(am)],
          ["Kosten pro Jahr (Tragbarkeit)", chf(tot)],
          ["Tatsächliche Kosten pro Jahr", chf(real)]
        ],
        note: "Mindestens 5 % des Kaufpreises müssen aus eigenen Mitteln stammen, nicht aus der Pensionskasse. Die Zahlen dienen der Orientierung."
      };
    }
  }];

  C.obligationen = [{
    t: "Kurs einer Obligation",
    in: [
      f("nw", "Nennwert", 100, "", { d: 2 }),
      f("c", "Coupon", 2, "% pro Jahr", { d: 2, max: 30 }),
      f("n", "Restlaufzeit", 10, "Jahre", { min: 1, max: 60 }),
      f("y", "Aktueller Marktzins", 3, "%", { d: 2, min: -2, max: 30 })
    ],
    calc: function (v) {
      var y = v.y / 100, cp = v.nw * v.c / 100, n = Math.round(v.n);
      var barwert = y === 0 ? cp * n : cp * (1 - pow(1 + y, -n)) / y;
      var kurs = barwert + v.nw * pow(1 + y, -n);
      var ab = v.nw ? (kurs / v.nw - 1) * 100 : 0;
      return {
        main: ["Kurs der Obligation", num(kurs, 1), (ab >= 0 ? "Plus " : "Minus ") + pc(Math.abs(ab), 1) + " gegenüber dem Nennwert von " + num(v.nw, 0) + "."],
        rows: [["Jährlicher Zins (Coupon)", num(cp, 2)], ["Rückzahlung am Ende", num(v.nw, 2)]],
        note: "Näherung mit jährlicher Zahlung. Wer bis zum Ende hält, erhält den Nennwert plus Zinsen zurück."
      };
    }
  }];

  C["kvg-grundversicherung"] = [{
    t: "Franchise vergleichen",
    in: [
      f("k", "Behandlungskosten pro Jahr", 3000, "CHF"),
      f("fa", "Franchise A", 300, "CHF"),
      f("pa", "Jahresprämie bei Franchise A", 4800, "CHF", { h: "Beispielwert, trage deine Prämie ein" }),
      f("fb", "Franchise B", 2500, "CHF"),
      f("pb", "Jahresprämie bei Franchise B", 3600, "CHF", { h: "Beispielwert, trage deine Prämie ein" })
    ],
    calc: function (v) {
      function eig(fr) { var x = Math.max(0, v.k - fr); return Math.min(v.k, fr) + Math.min(700, x * 0.1); }
      var ea = eig(v.fa), eb = eig(v.fb), ta = ea + v.pa, tb = eb + v.pb;
      var worstA = v.fa + 700, worstB = v.fb + 700;
      return {
        main: [ta <= tb ? "Franchise A ist günstiger" : "Franchise B ist günstiger", chf(Math.abs(ta - tb)) + " pro Jahr", "Gesamtkosten = Prämie + Eigenanteil bei " + chf(v.k) + " Behandlungskosten."],
        table: { head: ["", "Franchise A", "Franchise B"], rows: [["Franchise", chf(v.fa), chf(v.fb)], ["Eigenanteil", chf(ea), chf(eb)], ["Prämie", chf(v.pa), chf(v.pb)], ["Total pro Jahr", chf(ta), chf(tb)], ["Höchstens (schlechtestes Jahr)", chf(worstA + v.pa), chf(worstB + v.pb)]] },
        note: "Selbstbehalt 10 % bis höchstens CHF 700 (Erwachsene). Spitalbeitrag nicht eingerechnet. Prämien sind Beispielwerte."
      };
    }
  }];

  C.motorfahrzeug = [{
    t: "Wer zahlt den Schaden?",
    in: [
      f("w", "Wert deines Fahrzeugs", 20000, "CHF"),
      f("sf", "Schaden am anderen Fahrzeug", 8000, "CHF"),
      f("se", "Schaden an deinem Fahrzeug", 6000, "CHF"),
      f("sb", "Selbstbehalt Vollkasko", 1000, "CHF"),
      f("mp", "Mehrprämie Vollkasko pro Jahr", 600, "CHF")
    ],
    calc: function (v) {
      var eigen = Math.min(v.se, v.w), selbst = Math.min(v.sb, eigen), vk = eigen - selbst;
      return {
        main: ["Du sparst mit Vollkasko", chf(vk), v.mp > 0 ? "Das entspricht " + num(vk / v.mp, 1) + " Jahren Mehrprämie." : "Trage die Mehrprämie ein, um zu vergleichen."],
        table: { head: ["Posten", "Betrag", "Wer zahlt?"], rows: [["Anderes Fahrzeug", chf(v.sf), "Haftpflicht"], ["Dein Fahrzeug, mit Vollkasko", chf(eigen), "Vollkasko " + chf(vk) + ", du " + chf(selbst)], ["Dein Fahrzeug, ohne Vollkasko", chf(eigen), "Du zahlst " + chf(eigen)]] },
        note: "Der Schaden am eigenen Fahrzeug ist auf den Fahrzeugwert begrenzt."
      };
    }
  }];

  C.rechtsschutz = [{
    t: "Kosten eines Rechtsstreits",
    in: [
      f("h", "Stunden Anwalt", 20, "Std."),
      f("s", "Stundensatz", 300, "CHF"),
      f("g", "Gerichtskosten", 2000, "CHF"),
      f("p", "Parteientschädigung an Gegenseite (bei Niederlage)", 4000, "CHF"),
      f("pr", "Prämie Rechtsschutz pro Jahr", 300, "CHF")
    ],
    calc: function (v) {
      var a = v.h * v.s, t = a + v.g + v.p;
      return {
        main: ["Total bei Niederlage", chf(t), v.pr > 0 ? "Das entspricht " + num(t / v.pr, 0) + " Jahresprämien." : "Trage eine Prämie ein, um das Verhältnis zu sehen."],
        rows: [["Anwalt", chf(a)], ["Gerichtskosten", chf(v.g)], ["Parteientschädigung", chf(v.p)]],
        note: "Grobe Schätzung, die Tarife unterscheiden sich."
      };
    }
  }];

  C.reise = [{
    t: "Kosten eines Unfalls im Ausland",
    in: [
      f("b", "Behandlung vor Ort", 25000, "CHF"),
      f("r", "Rettung und Rücktransport", 40000, "CHF"),
      f("d", "Davon von der Grundversicherung gedeckt", 5000, "CHF"),
      f("p", "Prämie Reiseversicherung", 80, "CHF", { h: "pro Jahr" })
    ],
    calc: function (v) {
      var t = Math.max(0, v.b + v.r - v.d);
      return {
        main: ["Dein Risiko ohne Zusatzdeckung", chf(t), v.p > 0 ? "Das entspricht " + num(t / v.p, 0) + " Jahresprämien." : "Trage eine Prämie ein, um das Verhältnis zu sehen."],
        rows: [["Behandlung", chf(v.b)], ["Rücktransport", chf(v.r)], ["Abzüglich Grundversicherung", chf(v.d)]],
        note: "Beispielzahlen. Reale Kosten hängen vom Land und vom Fall ab."
      };
    }
  }];

  C.saeule1 = [{
    t: "Rentenkürzung bei fehlenden Beitragsjahren",
    in: [
      f("r", "Rente pro Monat (ohne Lücke)", 2520, "CHF", { h: "Maximalrente 2026 als Vorgabe" }),
      f("j", "Fehlende Beitragsjahre", 1, "Jahre", { max: 44 }),
      f("n", "Dauer des Rentenbezugs", 20, "Jahre", { max: 50 })
    ],
    calc: function (v) {
      var pm = v.r / 44 * v.j, py = pm * 12;
      return {
        main: ["Kürzung über " + v.n + " Rentenjahre", chf(py * v.n), "Deine Rente sinkt um rund " + chf(pm) + " pro Monat auf " + chf(v.r - pm) + "."],
        rows: [["Kürzung pro Monat", chf(pm)], ["Kürzung pro Jahr", chf(py)], ["Kürzung in Prozent", pc(v.j / 44 * 100, 1)]],
        note: "Näherung (1/44 pro Jahr). Die tatsächliche Berechnung läuft über die Rentenskala."
      };
    }
  }];

  C.saeule2 = [{
    t: "Altersguthaben hochrechnen",
    in: [
      f("l", "Jahreslohn", 70000, "CHF"),
      f("a", "Dein Alter heute", 25, "Jahre", { min: 25, max: 65 }),
      f("g", "Altersguthaben heute", 0, "CHF"),
      f("z", "Zins auf dem Guthaben", 0, "% pro Jahr", { d: 2, max: 10 }),
      f("u", "Umwandlungssatz", 6.8, "%", { d: 2, max: 10 })
    ],
    calc: function (v) {
      var koord = v.l < 22680 ? 0 : Math.max(3780, Math.min(v.l, 88200) - 26460);
      var g = v.g, sum = 0, age;
      for (age = Math.round(v.a); age < 65; age++) {
        var s = age < 35 ? 0.07 : age < 45 ? 0.10 : age < 55 ? 0.15 : 0.18;
        var gut = koord * s;
        g = g * (1 + v.z / 100) + gut;
        sum += gut;
      }
      return {
        main: ["Altersguthaben mit 65", chf(g), "Daraus ergibt sich bei " + pc(v.u, 2) + " eine Rente von " + chf(g * v.u / 100) + " pro Jahr (" + chf(g * v.u / 1200) + " pro Monat)."],
        rows: [["Koordinierter Lohn", chf(koord)], ["Summe der Altersgutschriften", chf(sum)], ["Gutschrift aktuell", chf(koord * (v.a < 35 ? 0.07 : v.a < 45 ? 0.10 : v.a < 55 ? 0.15 : 0.18))]],
        note: "Koordinationsabzug 26'460, oberer Grenzbetrag 88'200 (Stand 2026). Nur der obligatorische Teil, bei gleichbleibendem Lohn. Viele Kassen versichern mehr, aber mit tieferen Umwandlungssätzen im überobligatorischen Bereich."
      };
    }
  }];

  C.saeule3a = [{
    t: "Steuerersparnis und Endwert",
    in: [
      f("e", "Einzahlung pro Jahr", 7258, "CHF", { h: "Höchstbetrag mit Pensionskasse: CHF 7'258" }),
      f("s", "Grenzsteuersatz", 25, "%", { d: 1, max: 50 }),
      f("n", "Dauer", 30, "Jahre", { max: 50 }),
      f("r", "Rendite pro Jahr", 2, "%", { d: 2, max: 20 })
    ],
    calc: function (v) {
      var es = v.e * v.s / 100, end = fvAnnuity(v.e, v.r / 100, v.n);
      return {
        main: ["Steuerersparnis pro Jahr", chf(es), "Über " + v.n + " Jahre sind das " + chf(es * v.n) + "."],
        rows: [["Effektive Kosten der Einzahlung", chf(v.e - es)], ["Total einbezahlt", chf(v.e * v.n)], ["Guthaben nach " + v.n + " Jahren", chf(end)], ["Davon Ertrag", chf(end - v.e * v.n)]],
        note: "Bezugssteuer und Kosten der Anlagelösung sind nicht eingerechnet. Die Steuerersparnis ist hier nicht wieder angelegt."
      };
    }
  }];

  C.saeule3b = [{
    t: "3a oder 3b? Vergleich bei gleichem Nettoaufwand",
    in: [
      f("e", "Einzahlung 3a pro Jahr", 7258, "CHF"),
      f("s", "Grenzsteuersatz", 25, "%", { d: 1, max: 50 }),
      f("n", "Dauer", 25, "Jahre", { max: 50 }),
      f("r", "Rendite pro Jahr", 3, "%", { d: 2, max: 20 }),
      f("b", "Steuer beim Bezug der 3a", 5, "%", { d: 1, max: 30 }),
      f("v", "Vermögenssteuer auf 3b", 0.2, "% pro Jahr", { d: 2, max: 3 })
    ],
    calc: function (v) {
      var es = v.e * v.s / 100, netto = v.e - es;
      var e3a = fvAnnuity(v.e, v.r / 100, v.n);
      var n3a = e3a * (1 - v.b / 100);
      var e3b = fvAnnuity(netto, Math.max(0, v.r - v.v) / 100, v.n);
      var d = n3a - e3b;
      return {
        main: [d >= 0 ? "Vorteil 3a" : "Vorteil 3b", chf(Math.abs(d)), "Bei gleichem Nettoaufwand von " + chf(netto) + " pro Jahr nach " + v.n + " Jahren."],
        table: { head: ["", "Säule 3a", "Säule 3b"], rows: [["Netto-Aufwand pro Jahr", chf(netto), chf(netto)], ["Einzahlung pro Jahr", chf(v.e), chf(netto)], ["Guthaben vor Bezugssteuer", chf(e3a), chf(e3b)], ["Guthaben nach Steuern", chf(n3a), chf(e3b)]] },
        note: "Vereinfachtes Modell. 3b ist jederzeit verfügbar, 3a ist bis kurz vor der Pensionierung gebunden. Gebühren und Ertragssteuern sind nicht eingerechnet."
      };
    }
  }];

  C["unfall-uvg"] = [{
    t: "Taggeld berechnen",
    in: [
      f("l", "Jahreslohn", 72000, "CHF"),
      f("d", "Dauer der Arbeitsunfähigkeit", 60, "Tage", { max: 730 })
    ],
    calc: function (v) {
      var vers = Math.min(v.l, 148200), tg = vers * 0.8 / 365;
      return {
        main: ["Taggeld insgesamt", chf(tg * v.d), "Rund " + chf(tg) + " pro Kalendertag bei 80 % des versicherten Verdienstes."],
        rows: [["Versicherter Verdienst", chf(vers)], ["Nicht versicherter Lohnanteil", chf(Math.max(0, v.l - 148200))], ["Taggeld pro Tag", chf(tg)], ["Taggeld pro Monat (30 Tage)", chf(tg * 30)]],
        note: "Höchstbetrag des versicherten Verdienstes: CHF 148'200. Wartefristen und Lohnfortzahlung des Arbeitgebers sind nicht berücksichtigt."
      };
    }
  }];

  C.vorsorgeausweis = [{
    t: "Rente aus deinem Vorsorgeausweis",
    in: [
      f("g", "Projiziertes Altersguthaben mit 65", 280000, "CHF"),
      f("u", "Umwandlungssatz", 5.8, "%", { d: 2, max: 10 }),
      f("ek", "Geplanter Einkauf", 40000, "CHF"),
      f("l", "Jahreslohn", 70000, "CHF"),
      f("ahv", "AHV-Rente pro Monat (Annahme)", 2200, "CHF")
    ],
    calc: function (v) {
      var r0 = v.g * v.u / 100, r1 = (v.g + v.ek) * v.u / 100;
      var tot = r1 / 12 + v.ahv;
      return {
        main: ["Pensionskassenrente pro Jahr", chf(r0), "Das sind " + chf(r0 / 12) + " pro Monat. Mit Einkauf: " + chf(r1) + " pro Jahr (" + chf(r1 / 12) + " pro Monat)."],
        rows: [["Zusatzrente durch Einkauf pro Jahr", chf(r1 - r0)], ["Pensionskasse und AHV pro Monat (mit Einkauf)", chf(tot)], ["Anteil am heutigen Lohn", v.l ? pc(tot * 12 / v.l * 100, 0) : "–"]],
        note: "Der Einkauf ist hier ohne Zins dem Guthaben zugerechnet. Prüfe die Werte auf deinem Ausweis."
      };
    }
  }];

  C.vorsorgeluecke = [{
    t: "Vorsorgelücke berechnen",
    in: [
      f("l", "Jahreslohn", 80000, "CHF"),
      f("q", "Gewünschtes Einkommen im Alter", 60, "% vom Lohn", { d: 0, max: 150 }),
      f("ahv", "AHV-Rente pro Jahr", 30000, "CHF"),
      f("pk", "Pensionskassenrente pro Jahr", 12000, "CHF"),
      f("e", "Entnahme über", 20, "Jahre", { min: 1, max: 50 }),
      f("sj", "Sparzeit bis zur Pensionierung", 25, "Jahre", { min: 1, max: 60 }),
      f("r", "Rendite pro Jahr", 3, "%", { d: 2, max: 20 })
    ],
    calc: function (v) {
      var ziel = v.l * v.q / 100, luecke = Math.max(0, ziel - v.ahv - v.pk);
      var kap = luecke * v.e, r = v.r / 100;
      var rate = r === 0 ? kap / v.sj : kap * r / (pow(1 + r, v.sj) - 1);
      return {
        main: ["Vorsorgelücke pro Jahr", chf(luecke), "Das sind " + chf(luecke / 12) + " pro Monat." + (luecke === 0 ? " Es besteht keine Lücke." : "")],
        rows: [["Zielrente pro Jahr", chf(ziel)], ["Renten total (AHV und Pensionskasse)", chf(v.ahv + v.pk)], ["Nötiges Zusatzkapital", chf(kap)], ["Sparbetrag pro Jahr", chf(rate)], ["Sparbetrag pro Monat", chf(rate / 12)], ["Sparbetrag pro Jahr ohne Rendite", chf(kap / v.sj)]],
        note: "Vereinfacht: Das Kapital wird über die Entnahmedauer ohne weitere Verzinsung aufgebraucht. Einzahlung am Jahresende."
      };
    }
  }];

  C.zusatzversicherung = [{
    t: "Lohnt sich die Zahnzusatzversicherung?",
    in: [
      f("p", "Prämie pro Monat", 30, "CHF"),
      f("q", "Übernommener Anteil", 75, "%", { d: 0, max: 100 }),
      f("m", "Höchstleistung pro Jahr", 1500, "CHF"),
      f("k", "Zahnkosten im Jahr", 2000, "CHF")
    ],
    calc: function (v) {
      var leist = Math.min(v.k * v.q / 100, v.m), pj = v.p * 12, saldo = leist - pj;
      return {
        main: [saldo >= 0 ? "Gewinn in diesem Jahr" : "Verlust in diesem Jahr", chf(Math.abs(saldo)), "Leistung " + chf(leist) + " gegen Prämie " + chf(pj) + "." + (leist > 0 && pj > 0 ? " Eine solche Behandlung entspricht " + num(leist / pj, 1) + " Jahresprämien." : "")],
        rows: [["Prämie pro Jahr", chf(pj)], ["Leistung der Versicherung", chf(leist)], ["Du zahlst selbst", chf(v.k - leist)]],
        note: "Wartefristen sind nicht berücksichtigt. Rechne mit den echten Zahlen aus der Police."
      };
    }
  }];

  // ---------- Darstellung ----------
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (txt !== undefined) { e.textContent = txt; }
    return e;
  }

  function build(def, idx) {
    var wrap = el("div", "calc");
    var head = el("div", "calc__head");
    head.appendChild(el("p", "calc__kicker", "Rechner"));
    head.appendChild(el("h3", "calc__title", def.t));
    wrap.appendChild(head);
    wrap.appendChild(el("p", "calc__intro", "Trage deine eigenen Zahlen ein. Das Ergebnis aktualisiert sich sofort."));

    var form = el("div", "calc__form");
    var inputs = {};
    def.in.forEach(function (fd) {
      var id = "calc-" + idx + "-" + fd.k;
      var row = el("div", "calc__field");
      var lab = el("label", null, fd.l);
      lab.setAttribute("for", id);
      row.appendChild(lab);
      var box = el("div", "calc__box");
      var inp = el("input");
      inp.type = "text";
      inp.id = id;
      inp.inputMode = "decimal";
      inp.autocomplete = "off";
      inp.value = fmt(fd, fd.v);
      box.appendChild(inp);
      if (fd.u) { box.appendChild(el("span", "calc__unit", fd.u)); }
      row.appendChild(box);
      if (fd.h) { row.appendChild(el("small", null, fd.h)); }
      form.appendChild(row);
      inputs[fd.k] = inp;
      inp.addEventListener("input", render);
      inp.addEventListener("blur", function () { inp.value = fmt(fd, value(fd)); render(); });
    });
    wrap.appendChild(form);

    var out = el("div", "calc__out");
    out.setAttribute("aria-live", "polite");
    wrap.appendChild(out);

    var reset = el("button", "calc__reset", "Zurücksetzen");
    reset.type = "button";
    reset.addEventListener("click", function () {
      def.in.forEach(function (fd) { inputs[fd.k].value = fmt(fd, fd.v); });
      render();
    });
    wrap.appendChild(reset);

    function fmt(fd, x) {
      var s = num(x, fd.d).replace("−", "-");
      return s;
    }
    function value(fd) {
      var x = parse(inputs[fd.k].value);
      if (fd.min !== undefined) { x = Math.max(fd.min, x); }
      if (fd.max !== undefined) { x = Math.min(fd.max, x); }
      return x;
    }

    function render() {
      var v = {};
      def.in.forEach(function (fd) { v[fd.k] = value(fd); });
      var r;
      try { r = def.calc(v); } catch (e) { r = null; }
      out.textContent = "";
      if (!r) { return; }
      var main = el("div", "calc__main");
      main.appendChild(el("p", "calc__label", r.main[0]));
      main.appendChild(el("p", "calc__value", r.main[1]));
      if (r.main[2]) { main.appendChild(el("p", "calc__sub", r.main[2])); }
      out.appendChild(main);
      if (r.rows) {
        var dl = el("dl", "calc__rows");
        r.rows.forEach(function (rw) {
          dl.appendChild(el("dt", null, rw[0]));
          dl.appendChild(el("dd", null, rw[1]));
        });
        out.appendChild(dl);
      }
      if (r.table) {
        var tw = el("div", "table-wrap");
        var t = el("table");
        var thead = el("thead"), trh = el("tr");
        r.table.head.forEach(function (h) { trh.appendChild(el("th", null, h)); });
        thead.appendChild(trh);
        t.appendChild(thead);
        var tb = el("tbody");
        r.table.rows.forEach(function (rw) {
          var tr = el("tr");
          rw.forEach(function (c) { tr.appendChild(el("td", null, c)); });
          tb.appendChild(tr);
        });
        t.appendChild(tb);
        tw.appendChild(t);
        out.appendChild(tw);
      }
      if (r.note) { out.appendChild(el("p", "calc__note", r.note)); }
    }
    render();
    return wrap;
  }

  var id = document.body.getAttribute("data-id");
  var defs = C[id];
  var sec = document.querySelector("section.example");
  if (!defs || !sec) { return; }
  var h2 = sec.querySelector("h2");
  var ref = h2 ? h2.nextSibling : sec.firstChild;
  defs.forEach(function (d, i) {
    sec.insertBefore(build(d, i), ref);
  });
  // Ausgangsbeispiel klar vom Rechner trennen
  var lbl = el("p", "calc__example-label", "Ausgangsbeispiel");
  sec.insertBefore(lbl, ref);
})();
