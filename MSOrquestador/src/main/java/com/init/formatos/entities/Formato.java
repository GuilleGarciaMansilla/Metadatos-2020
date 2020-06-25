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
	private String name;
	
	@Column(name="url", nullable=false)
	private String eliminationURL;
	
	@Column(name="metadata", nullable=false)
	private String consultURL;
	
	public Formato() {}
	
	public Formato(String name, String eliminationURL,String consultURL) {
		this.name = name;
		this.eliminationURL = eliminationURL;
		this.consultURL = consultURL;
	}

	public String getNombre() {
		return name;
	}
	
	public void setNombre(String name) {
		this.name = name;
	}

	public String getUrl() {
		return eliminationURL;
	}
	
	public void setUrl(String eliminationURL) {
		this.eliminationURL = eliminationURL;
	}
	public String getMetadata() {
		return consultURL;
	}
	public void setMetadata(String consultURL) {
		this.consultURL =  consultURL;
	}
	
}
