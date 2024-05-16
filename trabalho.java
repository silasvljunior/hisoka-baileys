ATIVIDADE 1 - 2 PESSOA

public class Principal {

    public static void main(String[] args) {
        Pessoa p1 = new Pessoa("Luciano", "Av Paraná", "(44)99815-6521");
        
        p1.imprimir();
    }
}

—------------------------------------------------------------------------------------------------------------------------------------

public class Pessoa {
    private String nome;
    private String endereco;
    private String telefone;

    public Pessoa(String nome, String endereco, String telefone) {
        this.nome = nome;
        this.endereco = endereco;
        this.telefone = telefone;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }
 
    public void imprimir(){
        JOptionPane.showMessageDialog(null, "Nome: "+nome
        +"\nEndereço: "+endereco
        +"\nTelefone: "+telefone);
    }
}


ATIVIDADE 3 - 4 QUADRADO

public class Quadrado {
    private double lado;
    private double area;
    private double perimetro;

    public Quadrado(double lado) {
        this.lado = lado;
        calcularArea();
        calcularPerimetro();
    }

    public void calcularPerimetro (){
        perimetro = 4*lado;
    }
    
    public void calcularArea() {
        area =  lado * lado;
    }
    
    public void imprimir(){
        JOptionPane.showMessageDialog(null, "Lado: "+lado
        +"\nArea: "+area
        +"\nPerimêtro: "+perimetro);
    }
}

—------------------------------------------------------------------------------------------------------------------------------------

public class Principal {
    
    public static void main(String[] args) {
        Quadrado quad = new Quadrado(5);
        
        quad.imprimir();
    }
   
}


ATIVIDADE 5 - 6 RET NGULO

public class Retangulo {
    private double largura;
    private double area;
    private double comprimento; 
    private double perimetro;

    public Retangulo(double largura, double comprimento) {
        this.largura = largura;
        this.comprimento = comprimento;
        calcularArea();
        calcularPerimetro();
    }

    public void calcularPerimetro (){
        perimetro = (2*largura)+(2*comprimento);
    }
    
    public void calcularArea() {
        area =  largura * comprimento;
    }
    
    public void imprimir(){
        JOptionPane.showMessageDialog(null, "Largura: "+largura
        +"\nComprimento: "+comprimento
        +"\nArea: "+area
        +"\nPerimêtro: "+perimetro);
    }
}

—------------------------------------------------------------------------------------------------------------------------------------

public class Principal {
    
    public static void main(String[] args) {
        Retangulo ret = new Retangulo(2, 4);
        
        ret.imprimir();
    }
}


ATIVIDADE 7 - 8 CIRCULO

public class Principal {
  
    public static void main(String[] args) {
        Circulo circ = new Circulo(3);  

        circ.imprimir();
    }
   
}

—------------------------------------------------------------------------------------------------------------------------------------

public class Circulo {
    private double raio;
    private double area;
    private double perimetro;
    private double pi = 3.141516;

    public Circulo(double raio) {
        this.raio = raio;
        calcularArea();
        calcularPerimetro();
    }

    public void calcularPerimetro (){
        perimetro = 2 * pi *raio;
    }
    
    public void calcularArea() {
        area = pi * raio * raio;
    }
    
    public void imprimir(){
        JOptionPane.showMessageDialog(null, "Raio: "+raio
        +"\nArea: "+area
        +"\nPerimêtro: "+perimetro);
    }
}


ATIVIDADE 9 - 16 MOTO

public class Principal {
    public static void main(String[] args) {
        Moto m1 = new Moto("Yamaha", "YZF-R1", "Azul", 0, 0, 5, false);
        
        m1.imprimir();
        m1.ligar();
        m1.imprimir();
        m1.marchaAcima();
        m1.imprimir();
        m1.marchaAcima();
        m1.imprimir();
        m1.marchaAcima();
        m1.imprimir();
        m1.marchaAcima();
        m1.imprimir();
        m1.marchaAcima();
        m1.imprimir();
        m1.marchaAcima();
        m1.imprimir();
        m1.marchaAbaixo();
        m1.imprimir();
        m1.marchaAbaixo();
        m1.imprimir();
        m1.marchaAbaixo();
        m1.imprimir();
        m1.marchaAbaixo();
        m1.imprimir();
        m1.marchaAbaixo();
        m1.imprimir();
        m1.marchaAbaixo();
        m1.imprimir();
        m1.desligar();
        m1.imprimir();
    }
}

—------------------------------------------------------------------------------------------------------------------------------------

public class Moto {
    private String marca;
    private String modelo;
    private String cor;
    private Integer marcha;
    private Integer menormarcha;
    private Integer maiormarcha;
    private boolean ligada;
    
    public String descricaoMarcha(){
        if(marcha == 0){
            return "0 - Neutro";
        }else if(marcha == 1){
           return "1 - Primeira"; 
        }else if(marcha == 2){
           return "2 - Segunda"; 
        }else if(marcha == 3){
           return "3 - Terceira"; 
        }else if(marcha == 4){
           return "4 - Quarta"; 
        }else if(marcha == 5){
           return "5 - Quinta"; 
        }else{
            return "Marcha inválida";
        }
    }

    public Moto(String marca, String modelo, String cor, Integer marcha, Integer menormarcha, Integer maiormarcha, boolean ligada) {
        this.marca = marca;
        this.modelo = modelo;
        this.cor = cor;
        this.marcha = marcha;
        this.menormarcha = menormarcha;
        this.maiormarcha = maiormarcha;
        this.ligada = ligada;
    }

    public void imprimir(){
        JOptionPane.showMessageDialog(null, "Marca: "+marca
        +"\nModelo: "+modelo
        +"\nCor: "+cor
        +"\nMarcha: "+descricaoMarcha()
        +"\nMenor marcha: "+menormarcha
        +"\nMaior marcha: "+maiormarcha
        +"\nA moto está "+ (ligada ? "ligada!" : "desligada!"));
    }
    
    public void marchaAcima(){
        if(marcha < maiormarcha){
            marcha++;
            JOptionPane.showMessageDialog(null, "Marcha aumentada para: "+descricaoMarcha());
        }else{
            JOptionPane.showMessageDialog(null, "Não é possível aumentar a marcha além da máxima.");
        }
    }
    
    public void marchaAbaixo(){
        if(marcha > menormarcha){
            marcha--;
            JOptionPane.showMessageDialog(null, "Marcha diminuída para: "+descricaoMarcha());
        }else{
            JOptionPane.showMessageDialog(null, "Não é possível diminuir a marcha abaixo da mínima.");
        }
    }
    
    public void ligar(){
        this.ligada = true;
        JOptionPane.showMessageDialog(null, "Ligando a moto!");
    }
    
    public void desligar(){
        this.ligada = false;
        JOptionPane.showMessageDialog(null, "Desligando a moto!");
    }
}


ATIVIDADE 17 - 19 ELETRODOMÉSTICO

public class Principal {
    public static void main(String[] args) {
        Eletrodomestico freezer = new Eletrodomestico(false);
        
        freezer.imprimir();
        freezer.ligar();
        freezer.imprimir();
        freezer.desligar();
        freezer.imprimir();
    }
}

—------------------------------------------------------------------------------------------------------------------------------------

public class Eletrodomestico {
    private boolean ligado;

    public Eletrodomestico(boolean ligado) {
        this.ligado = ligado;
    }

    public boolean getLigado() {
        return ligado;
    }

    public void setLigado(boolean ligado) {
        this.ligado = ligado;
    }
    
    public void imprimir(){
        JOptionPane.showMessageDialog(null, "Estado do eletrodoméstico: "+ (ligado ? "Ligado" : "Desligado"));
    }
    
    public void ligar(){
        this.ligado = true;
        JOptionPane.showMessageDialog(null, "Ligando eletrodoméstico");
    }
    
    public void desligar(){
        this.ligado = false;
        JOptionPane.showMessageDialog(null, "Desligando eletrodoméstico");
    }
}

—------------------------------------------------------------------------------------------------------------------------------------
//exercicio 20
public class Televisor {

    private boolean ligado;
    private int canal;
    private int volume;


    public void imprimir() {
        System.out.println("Televisor está ligado? " + (ligado ? "Sim" : "Não"));
        System.out.println("Canal atual: " + canal);
        System.out.println("Volume atual: " + volume);
    }
}
//exercicio 21
public Televisor(boolean ligado, int canal, int volume) {
    this.ligado = ligado;
    this.canal = canal;
    this.volume = volume;
}
//exercicio 22 
public void ligar() {
    this.ligado = true;
}

public void desligar() {
    this.ligado = false;
}
//exercicio 23
public void imprimir() {
    System.out.println("Televisor está ligado? " + (ligado ? "Sim" : "Não"));
    System.out.println("Canal atual: " + canal);
    System.out.println("Volume atual: " + volume);
    System.out.println("Número máximo de canais: " + numeroCanais);
    System.out.println("Volume máximo: " + volumeMaximo);
}
//exercicio 24
public void canalAcima() {
    canal = (canal % numeroCanais) + 1;
}
—------------------------------------------------------------------------------------------------------------------------------------
public void canalAbaixo() {
    canal = (canal == 1) ? numeroCanais : canal - 1;
}
//exercicio 25
public void volumeAcima() {
    if (volume < volumeMaximo) {
        volume++;
    }
}

public void volumeAbaixo() {
    if (volume > 0) {
        volume--;
    }
}
//exercicio 26 
public class Televisor {
    private boolean ligado;


    public void imprimir() {
        System.out.println("Televisor está ligado? " + (ligado ? "Sim" : "Não"));
    }
}
//exercicio 27
public Televisor(boolean ligado) {
    this.ligado = ligado;
}

//exercicio 28 
public class Televisor {

    private boolean ligado;


    public void imprimir() {
        System.out.println("Televisor está ligado? " + (ligado ? "Sim" : "Não"));
    }
    
    public void ligar() {
        ligado = true;
    }

    public void desligar() {
        ligado = false;
    }
}
//exercicio 29
private boolean portaFechada;

public void imprimir() {
    System.out.println("Televisor está ligado? " + (ligado ? "Sim" : "Não"));
    System.out.println("Porta do microondas está fechada? " + (portaFechada ? "Sim" : "Não"));
}
//exercicio 30 
public void fecharPorta() {
    portaFechada = true;
}

public void abrirPorta() {
    portaFechada = false;
}
//exercicio 31 
public void ligar() {
    if (portaFechada) {
        ligado = true;
    } else {
        System.out.println("Não é possível ligar o microondas com a porta aberta.");
    }
}
