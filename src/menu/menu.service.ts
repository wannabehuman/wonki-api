import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepository.create(createMenuDto);
    return this.menuRepository.save(menu);
  }

  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      order: {
        order: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuRepository.findOneBy({ id });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(id);
    this.menuRepository.merge(menu, updateMenuDto);
    return this.menuRepository.save(menu);
  }

  async remove(id: string): Promise<void> {
    const menu = await this.findOne(id);
    await this.menuRepository.remove(menu);
  }
  
  // 계층 구조의 메뉴를 반환하는 메서드
  async getMenuTree(): Promise<any[]> {
    const allMenus = await this.findAll();
    
    // 최상위 메뉴 (부모가 없는 메뉴)를 필터링
    const rootMenus = allMenus.filter(menu => !menu.parentId);
    
    // 재귀적으로 자식 메뉴를 연결하는 함수
    const buildMenuTree = (parentMenu: Menu): any => {
      const children = allMenus.filter(menu => menu.parentId === parentMenu.id);
      
      return {
        ...parentMenu,
        children: children.length > 0
          ? children.map(child => buildMenuTree(child))
          : []
      };
    };
    
    // 각 최상위 메뉴에 대해 트리 구조 생성
    return rootMenus.map(rootMenu => buildMenuTree(rootMenu));
  }
  
  // 사용자 역할에 따른 메뉴 필터링
  async getMenuByRoles(userRoles: string[]): Promise<any[]> {
    const menuTree = await this.getMenuTree();
    
    // 메뉴를 역할에 따라 필터링하는 재귀 함수
    const filterMenuByRoles = (menu: any): any | null => {
      // 메뉴에 역할이 지정되지 않았거나, 사용자 역할과 메뉴 역할이 일치하는 경우만 표시
      const hasAccess = !menu.roles || menu.roles.length === 0 || 
        menu.roles.some((role: string) => userRoles.includes(role));
      
      if (!hasAccess) {
        return null;
      }
      
      // 자식 메뉴도 필터링
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = menu.children
          .map(filterMenuByRoles)
          .filter(Boolean);
        
        return {
          ...menu,
          children: filteredChildren
        };
      }
      
      return menu;
    };
    
    // 모든 최상위 메뉴에 대해 필터링 적용
    return menuTree
      .map(filterMenuByRoles)
      .filter(Boolean); // null 결과는 제거
  }
}
