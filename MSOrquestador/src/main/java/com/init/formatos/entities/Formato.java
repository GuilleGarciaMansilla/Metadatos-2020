package com.init.formatos.entities;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

//Objeto plano que representa a los formatos soportados

@Entity
@Table(name = "formatos")
public class Formato {
	
	@Id
	@Column(name="nombre", nullable=false)
	private String nombre;
	
	@Column(name="url", nullable=false)
	private String url;
	
	public Formato() {}
	
	public Formato(String nombre, String url) {
		this.nombre = nombre;
		this.url = url;
	}

	public String getNombre() {
		return nombre;
	}
	
	public void setNombre(String nombre) {
		this.nombre = nombre;
	}
	
	public String getUrl() {
		return url;
	}
	
	public void setUrl(String url) {
		this.url = url;
	}
	
}
